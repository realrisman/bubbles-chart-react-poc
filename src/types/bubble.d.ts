declare global {
  type BubbleType = "positive" | "negative";

  type Bubble = {
    id: number;
    title: string;
    total: number;
    count: { [key in BubbleType]: number };
  };

  type BubblesPayload = {
    elements: Bubble[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
  };
}

export {};
