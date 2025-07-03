import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft, Building2, Settings } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { getRoomById } from "@/lib/datacenter-data";
import { useParams, useRouter } from "next/navigation";

const RoomsHeader: React.FC = () => {
    const params = useParams()
    const router = useRouter()
    const roomId = params.id as string
    const room = getRoomById(roomId)

    return (
        <div className="flex w-full h-16 shrink-0 items-center justify-between border-b px-4 md:px-8">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Building2 className="h-4 w-4" />
                </div>
                <h1 className="text-xl font-semibold">{room ? room.name : "Stanza non trovata"}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Indietro
                </Button>
            </div>
        </div>
    )
}

export default RoomsHeader;