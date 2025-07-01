import React from "react";
import { Test } from "@/types/testconfig";
import { Product } from "@/types/products";
import ShadcnTable, { ShadcnColumn } from "@/components/ui/shadcn-table";

import VisitorPersonaDialog from "./VisitorPersonaDialog";
import TestConfigurationActions from "./TestConfigurationActions";

interface TestConfigurationTableProps {
  tests: Test[];
  fetchTests: () => Promise<void>;
  setTestToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  handleDelete: () => Promise<void>;
  formatDate: (dateString: string) => string;
  formatValue: (value: string) => string;
  getProductName: (productId: string) => string;
}

const TestConfigurationTable: React.FC<TestConfigurationTableProps> = ({
  tests,
  fetchTests,
  setTestToDelete,
  handleDelete,
  formatDate,
  formatValue,
  getProductName,
}) => {
  const columns: ShadcnColumn<Test>[] = [
    {
      key: "name",
      header: "Name",
      className: "py-3 font-medium text-slate-700",
      render: (value) => <span className="font-medium text-slate-800">{value}</span>,
    },
    {
      key: "product_id",
      header: "Product",
      className: "py-3 text-slate-700",
      render: (value) => getProductName(value),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "py-3 text-slate-700",
      render: (value) => formatDate(value),
    },
    {
      key: "visitor_persona",
      header: "Visitor Persona",
      className: "py-3 text-slate-700",
      render: (_, row) => (
        <VisitorPersonaDialog test={row} formatValue={formatValue} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "py-3 text-right w-[80px] text-slate-700",
      render: (_, row) => (
        <TestConfigurationActions
          test={row}
          fetchTests={fetchTests}
          setTestToDelete={setTestToDelete}
          handleDelete={handleDelete}
          formatDate={formatDate}
          formatValue={formatValue}
          getProductName={getProductName}
        />
      ),
    },
  ];

  return (
    <ShadcnTable
      columns={columns}
      data={tests}
      emptyMessage="No test configurations available."
      className="rounded-md border overflow-x-auto bg-muted/5 shadow-sm hover:shadow-md"
    />
  );
};

export default TestConfigurationTable;