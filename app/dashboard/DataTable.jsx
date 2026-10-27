// DAY 46 — a small generic table for the dashboard, as a SERVER component. It is the accessible
// twin of each chart: the same numbers as real <table> markup, which a screen reader can read,
// a person can copy into a spreadsheet, and a printer can print.
// columns: [{ key, label, numeric?, format? }]   rows: plain objects   total: optional footer row
export default function DataTable({ caption, columns, rows, footer, label, scroll = false }) {
  return (
    <div className={`table-scroll${scroll ? " tall" : ""}`} role="region" aria-label={label ?? caption} tabIndex={0}>
      <table className="data">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={c.numeric ? "num" : undefined}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c, j) => {
                const text = c.format ? c.format(r[c.key]) : r[c.key];
                return j === 0
                  ? <th key={c.key} scope="row">{text}</th>
                  : <td key={c.key} className={c.numeric ? "num" : undefined}>{text}</td>;
              })}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr>
              {columns.map((c, j) => {
                const text = footer[c.key];
                return j === 0
                  ? <th key={c.key} scope="row">{text}</th>
                  : <td key={c.key} className={c.numeric ? "num" : undefined}>{text}</td>;
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
