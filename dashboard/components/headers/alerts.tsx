import React from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"; // Update the import path to match your project structure
import { Input } from "../ui/input";

const AlertsHeader: React.FC = () => (
    <div className="flex w-full h-16 shrink-0 items-center justify-between border-b px-4 md:px-8">
        <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Alerts</h1>
        </div>
        <div className="flex items-center gap-2">
            <Input placeholder="Search alerts..." className="w-64" />
            <Select>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
            </Select>
            <Select>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
);

export default AlertsHeader;