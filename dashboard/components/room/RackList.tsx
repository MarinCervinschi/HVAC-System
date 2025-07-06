"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Wind, Waves, Wifi } from "lucide-react"
import { useRouter } from "next/navigation"
import { Room } from "@/types/room"
import { formatName } from "@/lib/utils"

interface RackListProps {
  roomInfo: Room
}

export default function RackList({ roomInfo }: RackListProps) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Rack</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {roomInfo.racks.map((rack) => (
          <Card
            key={rack.rack_id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/rooms/${roomInfo.room_id}/racks/${rack.rack_id}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      rack.rack_type === "air_cooled" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {rack.rack_type === "air_cooled" ? <Wind className="h-5 w-5" /> : <Waves className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{formatName(rack.rack_id)}</CardTitle>
                    <CardDescription>{formatName(roomInfo.room_id)}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                {rack.status === "ON" ? (
                   <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Wifi className="h-3 w-3 mr-1" />
                    Attivo
                  </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      <Wifi className="h-3 w-3 mr-1" />
                      Inattivo
                    </Badge>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground">Tipo:</span>
                    <div className="font-semibold">
                      {rack.rack_type === "air_cooled" ? "Raffreddamento ad Aria" : "Raffreddamento ad Acqua"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground">Smart Objects:</span>
                    <div className="font-semibold">{rack.smart_objects.length}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Dispositivi:</div>
                  <div className="flex flex-wrap gap-1">
                    {rack.smart_objects.map((obj, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {obj}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Ultimo aggiornamento:</span>
                  <span>{rack.last_update}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
