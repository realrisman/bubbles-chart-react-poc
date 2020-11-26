import React, { PureComponent } from "react";
import { BubbleChart } from "./components/BubbleChart";

import bubbles from "./data/bubbles.json";

const CHART_HEIGHT = 800;

export class App extends PureComponent {
  state = {
    bubbleChartRef: null,
    tooltipForBubbleId: null,
    tooltipForType: null,
  };

  selectedType = null;

  setBubbleChartRef = (ref: BubbleChart | null) => {
    this.setState({ bubbleChartRef: ref });
  };

  handleSingleBubbleHover = (id?: number | null, type?: BubbleType | null) =>
    this.setState({
      tooltipForBubbleId: id || null,
      tooltipForType: type || null,
    });

  handleBubbleClick = (bubbleType: BubbleType, id: number) => {
    // const bubble = bubbles.find((bubble) => bubble.id === id);
    // selectType(bubbleType);
    // selectBubble(bubbleType, bubble || null);
  };

  handleTypeChange = (type: BubbleType | null) => {
    // const { selectType, bubbles } = this.props;
    // selectType(type);
    // if (type && bubbles.length > 0) {
    //   const { id } = bubbles.reduce((selectedBubble, bubble) =>
    //     bubble.count[type] > selectedBubble.count[type]
    //       ? bubble
    //       : selectedBubble
    //   );
    //   this.handleBubbleClick(type, id);
    // }
  };

  getScale() {
    let lowArea = 0;
    let mediumArea = 0;
    let highArea = 0;

    for (const {
      count: { low, medium, high },
    } of bubbles.elements) {
      lowArea += (Math.PI * low) ** 2;
      mediumArea += (Math.PI * medium) ** 2;
      highArea += (Math.PI * high) ** 2;
    }

    const maxRadius = Math.sqrt(
      Math.max(lowArea + mediumArea + highArea) / Math.PI
    );

    return CHART_HEIGHT / 2.5 / maxRadius;
  }

  render() {
    const { tooltipForBubbleId, tooltipForType } = this.state;

    const scale = this.getScale();

    return (
      <BubbleChart
        bubbles={bubbles.elements}
        height={CHART_HEIGHT}
        onBubbleClick={this.handleBubbleClick}
        onBubbleFocus={this.handleSingleBubbleHover}
        onBubbleHover={this.handleSingleBubbleHover}
        ref={this.setBubbleChartRef}
        scale={scale}
        selectedId={undefined}
        tooltipForBubbleId={tooltipForBubbleId}
        tooltipForType={tooltipForType}
        type={this.selectedType}
        width={1450}
      />
    );
  }
}
