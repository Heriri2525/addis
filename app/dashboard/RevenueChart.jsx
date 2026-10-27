"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { etb } from "@/lib/format";

// DAY 46 — the only client code for this chart. Charts measure the DOM to size themselves, so
// this is a client LEAF; the page that renders it stays a server component.
//  * The wrapper has a REAL height (.chart is 18rem). A percentage of nothing is nothing: without
//    it the chart is invisible. A fixed height also reserves the space, so nothing jumps.
//  * The Y axis starts at ZERO: a bar's length IS its value.
//  * The unit is named (ETB), and every bar carries its value as text (LabelList), so the chart
//    reads without colour. The same numbers are in the table beneath it for screen readers.
//  * role="img" + aria-label gives assistive tech a summary and hides the SVG internals from it.
export default function RevenueChart({ data, label }) {
  return (
    <div className="chart" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="area" />
          <YAxis domain={[0, "auto"]} tickFormatter={etb} width={92} />
          <Tooltip formatter={(v) => [etb(v), "Revenue"]} />
          <Bar dataKey="revenue" name="Revenue" fill="#8a5a00" isAnimationActive={false}>
            <LabelList dataKey="revenue" position="top" formatter={etb} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
