import React from "react";
import { Test } from "@/types/testconfig";
import { Product } from "@/types/products";
import ShadcnTable, { ShadcnColumn } from "@/components/ui/shadcnTable/shadcn-table";

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
  currentPage?: number;
  paginationData?: {
    skip: number;
    limit: number;
    count: number;
    total_count: number;
    total_pages: number;
  };
  onPageChange?: (page: number) => void;
}

const TestConfigurationTable: React.FC<TestConfigurationTableProps> = ({
  tests,
  fetchTests,
  setTestToDelete,
  handleDelete,
  formatDate,
  formatValue,
  getProductName,
  currentPage,
  paginationData,
  onPageChange,
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
    <div className="bg-card rounded-lg border shadow">
      <ShadcnTable
        columns={columns}
        data={tests}
        currentPage={currentPage}
        paginationData={paginationData}
        onPageChange={onPageChange}
        emptyMessage="No test configurations available."
        className="w-full"
      />
    </div>
  );
};

export default TestConfigurationTable;