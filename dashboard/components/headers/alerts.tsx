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
            <Input placeholder="Cerca alerts..." className="w-64" />
            <Select>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="active">Attivi</SelectItem>
                    <SelectItem value="acknowledged">Riconosciuti</SelectItem>
                    <SelectItem value="resolved">Risolti</SelectItem>
                </SelectContent>
            </Select>
            <Select>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtra per gravità" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    <SelectItem value="critical">Critica</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Bassa</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
);

export default AlertsHeader;