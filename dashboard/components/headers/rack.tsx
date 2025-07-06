"use client"

import { useParams, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ArrowLeft, Wind, Waves, Download, RefreshCw } from "lucide-react";
import { formatName } from "@/lib/utils";

export function RackHeader() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;
    const rackId = params.rackId as string;
    const rack = formatName(rackId)

    if (!rack) {
        return (
            <div className="flex w-full h-16 shrink-0 items-center justify-between border-b px-4 md:px-8">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Separator orientation="vertical" className="h-4" />
                    <h1 className="text-xl font-semibold">Rack not found</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-16 shrink-0 items-center justify-between border-b px-4 md:px-8">
            <div className="flex items-center gap-2" >
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-lg ${
                        rackId.includes("_A")
                            ? "bg-orange-100 text-orange-600"
                            : "bg-blue-100 text-blue-600"
                    }`}
                    onClick={() => router.push(`/`)}
                >
                    {rackId.includes("_A") ? (
                        <Wind className="h-4 w-4" />
                    ) : (
                        <Waves className="h-4 w-4" />
                    )}
                </Button>
                <h1 className="text-xl font-semibold">{rack}</h1>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.refresh()}
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
}