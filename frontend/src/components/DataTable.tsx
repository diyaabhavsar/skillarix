import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import React from "react";

interface DataTableProps<T> {
  columns: { key: string; label: React.ReactNode; className?: string }[];
  data: T[];
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  renderRow?: (row: T) => React.ReactNode;
}

function DataTable<T extends { id: string | number } = any>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found.",
  renderRow,
}: DataTableProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length > 0 ? (
            data.map((row) =>
              renderRow ? (
                renderRow(row)
              ) : (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.key === "role" ? (
                        <Badge 
                            className={
                              row[col.key] === "admin"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }
                        >
                          {row[col.key]}
                        </Badge>
                      ) : col.key === "status" ? (
                        <Badge
                          className={
                            row[col.key] === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }
                        >
                          {row[col.key]}
                        </Badge>
                      ) : (
                        row[col.key]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )
            )
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;