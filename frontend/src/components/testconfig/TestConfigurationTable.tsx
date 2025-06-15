import React from "react";
import { Test } from "@/types/testconfig";
import { Product } from "@/types/products";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import VisitorPersonaDialog from "./VisitorPersonaDialog";
import TestConfigurationActions from "./TestConfigurationActions"; // New import

interface TestConfigurationTableProps {
  tests: Test[];
  deleteTest: (id: string) => Promise<void>;
  fetchTests: () => Promise<void>;
  products: Product[];
  fetchAllProducts: () => Promise<void>;
  testToDelete: string | null;
  setTestToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  handleDelete: () => Promise<void>;
  formatDate: (dateString: string) => string;
  formatValue: (value: string) => string;
  getProductName: (productId: string) => string;
}

const TestConfigurationTable: React.FC<TestConfigurationTableProps> = ({
  tests,
  deleteTest,
  fetchTests,
  products,
  fetchAllProducts,
  testToDelete,
  setTestToDelete,
  handleDelete,
  formatDate,
  formatValue,
  getProductName,
}) => {
  return (
    <div className="rounded-md border overflow-x-auto bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium">Name</TableHead>
            <TableHead className="font-medium">Product</TableHead>
            <TableHead className="font-medium">Created At</TableHead>
            <TableHead className="font-medium">Visitor Persona</TableHead>
            <TableHead className="font-medium text-right w-[80px]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test._id} className="hover:bg-gray-50">
              <TableCell className="py-3">{test.name}</TableCell>
              <TableCell className="py-3">
                {getProductName(test.product_id)}
              </TableCell>
              <TableCell className="py-3">
                {formatDate(test.created_at)}
              </TableCell>
              <TableCell className="py-3">
                <VisitorPersonaDialog
                  test={test}
                  formatValue={formatValue}
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <TestConfigurationActions
                    test={test}
                    fetchTests={fetchTests}
                    setTestToDelete={setTestToDelete}
                    handleDelete={handleDelete}
                    formatDate={formatDate}
                    formatValue={formatValue}
                    getProductName={getProductName}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TestConfigurationTable;