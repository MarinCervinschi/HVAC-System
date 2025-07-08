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
    </div>
);

export default AlertsHeader;