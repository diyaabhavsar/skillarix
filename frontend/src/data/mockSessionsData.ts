
export interface PastSession {
  id: string;
  date: string;
  time: string;
  product: string;
  totalScore: number;
  status: "completed" | "in-progress";
}

export const pastSessionsData: PastSession[] = [
  {
    id: "s1",
    date: "2025-05-12",
    time: "14:30",
    product: "Sales Navigator Pro",
    totalScore: 82,
    status: "completed",
  },
  {
    id: "s2",
    date: "2025-05-10",
    time: "10:15",
    product: "CRM Enterprise Suite",
    totalScore: 76,
    status: "completed",
  },
  {
    id: "s3",
    date: "2025-05-05",
    time: "16:45",
    product: "Analytics Dashboard",
    totalScore: 90,
    status: "completed",
  },
  {
    id: "s4",
    date: "2025-05-01",
    time: "09:20",
    product: "Sales Navigator Pro",
    totalScore: 68,
    status: "completed",
  },
  {
    id: "s5",
    date: "2025-04-28",
    time: "11:00",
    product: "CRM Enterprise Suite",
    totalScore: 0,
    status: "in-progress",
  },
];
