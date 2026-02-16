import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MetricHistory } from "../types";

interface Props {
  metricKey: string;
  data: MetricHistory[];
}

function MetricChart({ metricKey, data }: Props) {
  const chartData = data.map((d) => ({
    step: d.step,
    value: d.value,
  }));

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>{metricKey}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="step" label={{ value: "Step", position: "bottom" }} />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#fff",
    padding: 16,
    borderRadius: 8,
    border: "1px solid #e0e0e0",
  },
  title: { fontSize: 14, marginBottom: 12, color: "#333" },
};

export default MetricChart;
