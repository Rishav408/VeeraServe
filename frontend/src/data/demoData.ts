import type { Feedback, Order, User } from "../types/domain";

export const initialOrders: Order[] = [
  {
    id: "ORD-1001",
    customerName: "Ananya",
    items: [{ itemId: "25", quantity: 1 }, { itemId: "14", quantity: 2 }],
    total: 475,
    status: "served",
    createdAt: Date.now() - 7200000
  }
];

export const initialFeedback: Feedback[] = [
  {
    id: "FDB-1",
    user: "Rahul",
    rating: 5,
    comment: "Loved the butter chicken and quick service!",
    createdAt: Date.now() - 1200000
  }
];

export const initialUsers: User[] = [
  { id: "U-guest", name: "Guest", role: "guest" },
  { id: "U-admin", name: "Admin", role: "admin" }
];
