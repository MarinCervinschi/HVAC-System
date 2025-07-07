"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Snowflake } from "lucide-react"
import { SmartObject } from "@/types/smartobject"

interface CoolingSystemHubProps {
  smartObject: SmartObject
  initialCoolingLevel?: number
  initialCoolingStatus?: boolean
}

export default function CoolingSystemHub({ 
  smartObject, 
  initialCoolingLevel = 3, 
  initialCoolingStatus = true 
}: CoolingSystemHubProps) {
  const coolingActuator = smartObject.actuators?.find((a) => a.type === "cooling")
  const [coolingLevel, setCoolingLevel] = useState(initialCoolingLevel)
  const [coolingStatus, setCoolingStatus] = useState(initialCoolingStatus)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Snowflake className="h-5 w-5" />
          Cooling System Hub
        </CardTitle>
        <CardDescription>Room cooling system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">System Status</p>
              <p className="text-sm text-muted-foreground">
                {coolingStatus ? "System active" : "System off"}
              </p>
            </div>
            <Switch checked={coolingStatus} onCheckedChange={setCoolingStatus} />
          </div>

          {coolingStatus && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3">Cooling Level: {coolingLevel}</Label>
                <Slider
                  value={[coolingLevel]}
                  onValueChange={(value) => setCoolingLevel(value[0])}
                  max={coolingActuator?.max_level || 5}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Min (1)</span>
                  <span>Max ({coolingActuator?.max_level || 5})</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
