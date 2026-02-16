"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MetricHistory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  metricKey: string;
  data: MetricHistory[];
}

export function MetricChart({ metricKey, data }: Props) {
  const chartData = data.map((d) => ({
    step: d.step,
    value: d.value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{metricKey}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" label={{ value: "Step", position: "bottom" }} />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
