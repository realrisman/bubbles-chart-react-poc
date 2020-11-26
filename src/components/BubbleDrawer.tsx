import { BubbleNodeType } from "./nodes";
import { Selection } from "d3-selection";
import { Simulation } from "d3-force";

import styles from "./BubbleDrawer.module.scss";
import * as d3 from "d3";

type Props = {
  svg: Selection<SVGElement, BubbleNodeType, null, undefined> | null;
  onBubbleClick?: (type: BubbleType, number: number) => unknown;
  onBubbleFocus?: (id?: number | null, type?: BubbleType) => unknown;
  onBubbleHover?: (id?: number | null, type?: BubbleType) => unknown;
  onTabPressed?: (event: KeyboardEvent) => unknown;
};

export default class BubbleDrawer {
  props: Props;
  bubblesPositive: Selection<
    SVGCircleElement,
    BubbleNodeType,
    SVGElement,
    BubbleNodeType
  > | null = null;
  rectPositive: Selection<
    SVGRectElement,
    BubbleNodeType,
    SVGElement,
    BubbleNodeType
  >;
  bubblesNegative: Selection<
    SVGCircleElement,
    BubbleNodeType,
    SVGElement,
    BubbleNodeType
  > | null = null;
  rectNegative: Selection<
    SVGRectElement,
    BubbleNodeType,
    SVGElement,
    BubbleNodeType
  >;
  bubblesText: Selection<
    SVGTextElement,
    BubbleNodeType,
    SVGElement,
    BubbleNodeType
  >;
  bubblesTextPercentage: Selection<
    SVGTextElement,
    BubbleNodeType,
    SVGElement,
    BubbleNodeType
  >;

  constructor(props: Props) {
    this.props = props;
  }

  draw(simulation: Simulation<BubbleNodeType, undefined>): BubbleDrawer {
    const { svg } = this.props;
    if (!svg) return this;

    const color = d3
      .scaleThreshold<number, string>()
      .domain([40, 75, 90])
      .range(["red", "yellow", "green"]);

    const leafRoot = svg
      .selectAll("a")
      .data(simulation.nodes())
      .join("a")
      .attr("href", (d) => `#${d.name}`);

    const leafPositive = leafRoot
      .append("g")
      .join("g")
      .attr("class", styles.gPositive);

    this.rectPositive = leafPositive
      .append("clipPath")
      .attr("id", (d) => `clip-${d.bubbleId}-positive`)
      .append("rect")
      .attr("height", (d) => d.r * 2 + 10)
      .attr("width", (d) => d.r * 2 + 10);

    this.bubblesPositive = leafPositive
      .append("circle")
      .attr("clip-path", (d) => `url(#clip-${d.bubbleId}-positive)`)
      .attr("r", (d) => d.r)
      .attr("class", styles.bubble)

      .on("mouseover", this.handleMouseOver)
      .on("focus", this.handleFocus)
      .on("click", this.handleClick);

    const leafNegative = leafRoot
      .append("g")
      .join("g")
      .attr("class", styles.gNegative);

    this.rectNegative = leafNegative
      .append("clipPath")
      .attr("id", (d) => `clip-${d.bubbleId}-negative`)
      .append("rect")
      .attr("height", (d) => d.r * 2 + 10)
      .attr("width", (d) => d.r * 2 + 10);

    this.bubblesNegative = leafNegative
      .append("circle")
      .attr("clip-path", (d) => `url(#clip-${d.bubbleId}-negative`)
      .attr("r", (d) => d.r)
      .attr("class", styles.bubble)

      .on("mouseover", this.handleMouseOver)
      .on("focus", this.handleFocus)
      .on("click", this.handleClick);

    this.bubblesText = leafRoot
      .append("text")
      .text((d) => String(d.name))
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", 20)
      .style("font-weight", 600);

    this.bubblesTextPercentage = leafRoot
      .append("text")
      .text((d) => `${String(d.count.positive)}%`)
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", 16);

    simulation.on("tick", this.handleTick).restart();
    return this;
  }

  handleTick = (): void => {
    this.rectPositive &&
      this.rectPositive
        .attr("x", (d: BubbleNodeType) => {
          return d.x - d.r - 5;
        })
        .attr("y", (d: BubbleNodeType) => d.y - d.r - 5);

    this.bubblesPositive &&
      this.bubblesPositive
        .attr("cx", (d: BubbleNodeType) => d.x)
        .attr("cy", (d: BubbleNodeType) => d.y)
        .attr("r", (d: BubbleNodeType) => d.r);

    this.rectNegative &&
      this.rectNegative
        .attr("x", (d: BubbleNodeType) => {
          const percentage = d.count.positive / 100;
          const width = d.r * 2;
          const result = width * percentage;
          const start = d.x - d.r;
          return start + result;
        })
        .attr("y", (d: BubbleNodeType) => d.y - d.r);

    this.bubblesNegative &&
      this.bubblesNegative
        .attr("cx", (d: BubbleNodeType) => d.x)
        .attr("cy", (d: BubbleNodeType) => d.y)
        .attr("r", (d: BubbleNodeType) => d.r);

    this.bubblesText &&
      this.bubblesText
        .attr("x", (d: BubbleNodeType) => d.x)
        .attr("y", (d: BubbleNodeType) => d.y);

    this.bubblesTextPercentage &&
      this.bubblesTextPercentage
        .attr("x", (d: BubbleNodeType) => d.x)
        .attr("y", (d: BubbleNodeType) => d.y + 20);
  };

  handleClick = (d: BubbleNodeType): void => {
    const { onBubbleClick } = this.props;
    onBubbleClick && onBubbleClick(d.mastery, d.skillId);
  };

  handleMouseOver = ({
    skillId,
    type,
  }: {
    skillId: number;
    type: BubbleType;
  }): void => {
    const { onBubbleHover } = this.props;
    onBubbleHover && onBubbleHover(skillId, type);

    // svg &&
    //   svg
    //     .selectAll<SVGCircleElement, BubbleNodeType>("circle")
    //     .attr("opacity", (d) => (skillId === d.skillId ? 1 : 0.5));
  };

  handleMouseLeave = (): void => {
    const { onBubbleHover, svg } = this.props;
    onBubbleHover && onBubbleHover(null);

    svg && svg.selectAll("circle").attr("opacity", 1);
  };

  handleFocus = ({
    skillId,
    type,
  }: {
    skillId: number;
    type: BubbleType;
  }): void => {
    const { onBubbleFocus } = this.props;
    onBubbleFocus && onBubbleFocus(skillId, type);
  };

  public focus = (skillId: string, type: BubbleType): BubbleDrawer => {
    const { svg } = this.props;
    const node =
      svg && svg.select<SVGCircleElement>(`#bubble${skillId}${type}`).node();
    let nextBubble = node && node.nextElementSibling;
    while (nextBubble && nextBubble.getAttribute("tabindex") !== "0") {
      nextBubble = nextBubble.nextElementSibling;
    }
    nextBubble &&
      nextBubble instanceof SVGElement &&
      nextBubble.focus &&
      nextBubble.focus();
    return this;
  };

  setTabbableBubbles = (type: BubbleType | null): BubbleDrawer => {
    const { svg } = this.props;
    svg &&
      svg
        .selectAll<SVGCircleElement, BubbleNodeType>("circle")
        .attr("tabindex", (d) => (!type || type === d.mastery ? 0 : -1));
    return this;
  };

  highlightType = (type?: BubbleType | null) => {
    const { svg } = this.props;
    if (!svg) return this;
    const count = {
      positive: 0,
      negative: 0,
    };
    const bubbles = svg.selectAll<SVGCircleElement, BubbleNodeType>("circle");
    bubbles.each((d) => {
      count[d.mastery] += d.initialRadius;
    });
    const alpha = type
      ? (count.positive + count.negative) / count[type] / 2
      : 1;
    bubbles.each((d) => {
      d.r = d.initialRadius * Math.min(d.mastery === type ? alpha : 1, 5);
    });
    return this;
  };

  public remove = (): BubbleDrawer => {
    const { svg } = this.props;
    svg && svg.selectAll("circle").remove();
    return this;
  };
}
