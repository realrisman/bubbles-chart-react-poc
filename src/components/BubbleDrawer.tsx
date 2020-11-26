import t from "format-message";
import { BubbleNodeType } from "./nodes";
import { Selection } from "d3-selection";
import { Simulation } from "d3-force";

import styles from "./BubbleDrawer.module.scss";

type Props = {
  svg: Selection<SVGElement, BubbleNodeType, null, undefined> | null;
  onBubbleClick?: (type: BubbleType, number: number) => unknown;
  onBubbleFocus?: (id?: number | null, type?: BubbleType) => unknown;
  onBubbleHover?: (id?: number | null, type?: BubbleType) => unknown;
  onTabPressed?: (event: KeyboardEvent) => unknown;
};

const bubbleClassByType = {
  positive: styles.positiveBubble,
  negative: styles.lowBubble,
};

export default class BubbleDrawer {
  props: Props;
  bubbles: Selection<
    SVGCircleElement,
    BubbleNodeType,
    SVGElement,
    BubbleNodeType
  > | null = null;
  bubblesText: Selection<
    SVGTextElement,
    BubbleNodeType,
    SVGElement,
    BubbleNodeType
  >;
  rectPositive: Selection<
    SVGRectElement,
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

    const leaf = svg.selectAll("g").data(simulation.nodes()).join("g");

    this.rectPositive = leaf
      .append("clipPath")
      .attr("id", (d) => `clip-${d.bubbleId}`)
      .append("rect")
      .style("fill", "#c5d7ea")
      .attr("height", (d) => d.r * 2)
      .attr("width", (d) => d.r * 2);

    this.bubbles = leaf
      .append("circle")
      .attr("clip-path", (d) => `url(#clip${d.bubbleId})`)
      .attr("r", (d) => d.r)
      .attr("class", (d) => bubbleClassByType[d.mastery])
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("id", (d) => d.bubbleId)
      .attr("aria-label", (d) =>
        t("Select {bubbleName}", { bubbleName: d.name })
      )

      .on("mouseover", this.handleMouseOver)
      .on("focus", this.handleFocus)
      .on("click", this.handleClick);

    this.bubblesText = leaf
      .append("text")
      .text((d) => String(d.name))
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .style("font-size", 12);

    this.bubbles && this.bubbles.exit().remove();
    this.bubblesText && this.bubblesText.exit().remove();

    simulation.on("tick", this.handleTick).restart();
    return this;
  }

  handleTick = (): void => {
    this.rectPositive &&
      this.rectPositive
        .attr("x", (d: BubbleNodeType) => d.x)
        .attr("y", (d: BubbleNodeType) => d.y);

    this.bubbles &&
      this.bubbles
        .attr("cx", (d: BubbleNodeType) => d.x)
        .attr("cy", (d: BubbleNodeType) => d.y)
        .attr("r", (d: BubbleNodeType) => d.r);

    this.bubblesText &&
      this.bubblesText
        .attr("x", (d: BubbleNodeType) => d.x)
        .attr("y", (d: BubbleNodeType) => d.y);
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
