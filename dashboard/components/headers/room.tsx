import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { formatName } from "@/lib/utils";

const RoomsHeader: React.FC = () => {
    const params = useParams()
    const router = useRouter()
    const roomId = params.id as string
    const room = formatName(roomId)

    return (
        <div className="flex w-full h-16 shrink-0 items-center justify-between border-b px-4 md:px-8">
            <div className="flex items-center gap-2">
                <Button className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600" onClick={() => router.push(`/`)}>
                    <Building2 className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold">{room ? `${room}` : "Room not found"}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>
        </div>
    )
}

export default RoomsHeader;