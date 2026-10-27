"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// DAY 46 — change over time, so a LINE. One series, dots on every point (so it is readable
// without colour or hue), integer ticks (you cannot have 2.5 orders), range and unit stated in
// the heading above and in aria-label. A line chart MAY start above zero; this one still starts
// at zero because the counts are small and honest is cheap.
export default function OrdersChart({ data, label }) {
  return (
    <div className="chart" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={28} />
          <YAxis domain={[0, "auto"]} allowDecimals={false} width={44} />
          <Tooltip formatter={(v) => [v, "Orders"]} labelFormatter={(l) => l} />
          <Line type="monotone" dataKey="orders" name="Orders" stroke="#8a5a00" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
