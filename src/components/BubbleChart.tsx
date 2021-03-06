import {
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  Simulation,
} from "d3-force";
import { select, Selection } from "d3-selection";
import React, { HTMLAttributes, PureComponent } from "react";
import { interpolate } from "../utils/timings";
import BubbleDrawer from "./BubbleDrawer";
import { BubbleNodeType, generateNodes } from "./nodes";

type Props = HTMLAttributes<HTMLDivElement> & {
  height: number;
  type: BubbleType | null;
  onBubbleClick?: (type: BubbleType, number: number) => unknown;
  onBubbleFocus?: (id?: number | null, type?: BubbleType) => unknown;
  onBubbleHover?: (id?: number | null, type?: BubbleType) => unknown;
  scale: number;
  selectedId?: number;
  bubbles: Bubble[];
  tooltipForBubbleId?: number | null;
  tooltipForType?: BubbleType | null;
  width: number;
};

export class BubbleChart extends PureComponent<Props> {
  svg:
    | Selection<SVGElement, BubbleNodeType, null, undefined>
    | null
    | undefined;
  setSVGRef = (svg: SVGElement | null) => {
    this.svg = svg ? select(svg) : null;
  };

  simulation: Simulation<BubbleNodeType, undefined> | null | undefined;
  bubbleDrawer: BubbleDrawer | null;
  center: {
    x: number;
    y: number;
  } = {
    x: 500,
    y: 300,
  };

  componentDidMount() {
    const { width, height } = this.props;
    this.svg && this.svg.append("g");
    this.center.x = width / 2;
    this.center.y = height / 2;

    this.renderSimulation();
  }

  componentDidUpdate(prevProps: Props) {
    const { type } = this.props;
    if (prevProps.bubbles !== this.props.bubbles) {
      this.renderSimulation();
    } else {
      if (prevProps.type !== type) {
        if (type) {
          this.joinBubblesByType();
        } else {
          this.joinBubbles();
        }
        this.bubbleDrawer && this.bubbleDrawer.setTabbableBubbles(type);
      }
    }
  }

  componentWillUnmount() {
    this.simulation && this.simulation.stop();
    this.bubbleDrawer && this.bubbleDrawer.remove();
  }

  renderSimulation = () => {
    const {
      bubbles,
      scale,
      height,
      width,
      onBubbleClick,
      onBubbleHover,
      onBubbleFocus,
      type,
    } = this.props;

    const nodes = generateNodes({
      bubbles,
      scale,
      height,
      width,
      centerY: this.center.y,
    });
    if (!nodes.length) return;

    this.simulation = forceSimulation(nodes);

    this.bubbleDrawer = new BubbleDrawer({
      svg: this.svg!,
      onBubbleClick,
      onBubbleHover,
      onBubbleFocus,
    });
    this.bubbleDrawer.draw(this.simulation);

    if (type) {
      this.joinBubblesByType();
    } else {
      this.joinBubbles();
    }
  };

  defaultCharge = (d: BubbleNodeType): number => -0.07 * Math.pow(d.r, 2.0);
  weakCharge = (d: BubbleNodeType): number => -0.078 * Math.pow(d.r, 2.0);

  getMasteryGroups = (): Record<BubbleType, number> => {
    const { type, width } = this.props;
    const target = width / 2;
    const outsidePosX: Record<BubbleType, number> = {
      positive: width + this.center.x,
      negative: -this.center.x,
    };

    return {
      positive: type === "positive" ? target : outsidePosX.positive,
      negative: type === "negative" ? target : outsidePosX.negative,
    };
  };

  joinBubbles = () => {
    const { scale, width, height } = this.props;
    const forceStrength = 0.04;
    const targetY = {
      positive: this.center.y - interpolate(scale / 20, 15, 50),
      negative: this.center.y + interpolate(scale / 20, 15, 50),
    };

    this.bubbleDrawer && this.bubbleDrawer.highlightType();

    this.simulation &&
      this.simulation
        .alpha(0.85)
        .alphaDecay(0.00358)
        .alphaTarget(0)
        .alphaMin(0.15)
        .velocityDecay(0.11)
        .force("collide", null)
        .force("center", forceCenter(width / 2, height / 2))
        .force(
          "charge",
          forceManyBody<BubbleNodeType>().strength(this.defaultCharge)
        )
        .force("x", forceX().strength(forceStrength).x(this.center.x))
        .force(
          "y",
          forceY<BubbleNodeType>()
            .strength(forceStrength + 0.002)
            .y((d) => targetY[d.mastery])
        )
        .restart();
  };

  joinBubblesByType = () => {
    if (!this.simulation) return;
    const { type } = this.props;
    const forceStrength = 0.04;
    const groups = this.getMasteryGroups();
    const offset = 20;

    this.bubbleDrawer && this.bubbleDrawer.highlightType(type);

    this.simulation &&
      this.simulation
        .alpha(1)
        .alphaDecay(0.025)
        .alphaTarget(0)
        .alphaMin(0)
        .velocityDecay(0.13)

        .force(
          "x",
          forceX<BubbleNodeType>()
            .strength(forceStrength)
            .x((d) => groups[d.mastery] + offset)
        )
        .force(
          "y",
          forceY()
            .strength(forceStrength + 0.002)
            .y(this.center.y)
        )
        .force("collide", null)
        .force("center", null)
        .force(
          "charge",
          forceManyBody<BubbleNodeType>().strength(this.weakCharge)
        )
        .restart();
  };

  splitBubbles = () => {
    const { width } = this.props;
    const groupsTarget = {
      positive: width * 0.8,
      negative: width * 0.2,
    };
    const forceStrength = 0.04;
    const offset = 100;

    this.bubbleDrawer && this.bubbleDrawer.highlightType();

    this.simulation &&
      this.simulation
        .alpha(1)
        .alphaDecay(0.0228)
        .alphaTarget(0)
        .alphaMin(0)
        .velocityDecay(0.1)

        .force(
          "x",
          forceX<BubbleNodeType>()
            .strength(forceStrength)
            .x((d) => groupsTarget[d.mastery])
        )
        .force(
          "y",
          forceY()
            .strength(forceStrength)
            .y(this.center.y - offset)
        )
        .force(
          "collide",
          forceCollide<BubbleNodeType>().radius((d) => d.r + 3)
        )
        .force("charge", null)
        .force("center", null)
        .restart();
  };

  handleMouseLeave = () => {
    this.bubbleDrawer && this.bubbleDrawer.handleMouseLeave();
  };

  handleTooltipBlur = () => {
    const { tooltipForBubbleId, tooltipForType } = this.props;
    tooltipForBubbleId &&
      tooltipForType &&
      this.bubbleDrawer &&
      this.bubbleDrawer.focus(tooltipForBubbleId.toString(), tooltipForType);
  };

  render() {
    const {
      height,
      type,
      onBubbleClick,
      onBubbleFocus,
      onBubbleHover,
      scale,
      selectedId,
      bubbles,
      tooltipForBubbleId,
      tooltipForType,
      width,
      ...props
    } = this.props;

    return (
      <div
        aria-controls="bubbleChartTabPanel"
        onClick={this.handleMouseLeave}
        onMouseLeave={this.handleMouseLeave}
        tabIndex={-1}
        {...props}
      >
        <svg
          focusable="false"
          height={height}
          ref={this.setSVGRef}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
        />
      </div>
    );
  }
}
