import { Loading } from '../Spinner.jsx';

export default function DataTable({ columns, rows, loading, keyField = 'id', emptyText = 'No data' }) {
  if (loading) return <Loading />;
  return (
    <div className="tw"><div className="ts"><table>
      <thead><tr>{columns.map(col => <th key={col.key}>{col.label}</th>)}</tr></thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={columns.length} style={{ textAlign:'center',color:'var(--tx3)',padding:24 }}>{emptyText}</td></tr>
          : rows.map(row => (
            <tr key={row[keyField]}>
              {columns.map(col => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        }
      </tbody>
    </table></div></div>
  );
}
