const MIN_RADIUS = 10;

export type BubbleNodeType = {
  bubbleId: string;
  initialRadius: number;
  mastery: BubbleType;
  name: String;
  r: number;
  skillId: number;
  x: number;
  y: number;
  count: {
    positive: number;
    negative: number;
  };
};

export function generateNodes({
  bubbles,
  scale,
  width,
}: {
  bubbles: Bubble[];
  scale: number;
  height: number;
  width: number;
  centerY: number;
}): BubbleNodeType[] {
  const nodes: BubbleNodeType[] = [];

  for (const bubble of bubbles) {
    const { id, total, title: name, count } = bubble;

    const totalR = Math.max(total * scale, MIN_RADIUS);

    total > 0 &&
      nodes.push({
        bubbleId: `bubble${id}`,
        initialRadius: totalR,
        mastery: "positive",
        name,
        r: totalR,
        skillId: id,
        x: Math.random() * width,
        y: 0,
        count: count,
      });
  }

  return nodes;
}
