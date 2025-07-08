"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Snowflake, RefreshCw } from "lucide-react"
import { SmartObject } from "@/types/smartobject"
import { toast } from "sonner"

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
  const [isToggling, setIsToggling] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [savedCoolingLevel, setSavedCoolingLevel] = useState(initialCoolingLevel) // Nuovo stato per tracciare l'ultimo valore salvato
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:7070/hvac/api"

  // Handle toggle switch
  const handleToggle = async (checked: boolean) => {
    setIsToggling(true)
    try {
      const response = await fetch(`${API_URL}/proxy/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: {
            status: checked ? "ON" : "OFF"
          },
          object_id: smartObject.id,
          room_id: smartObject.room_id,
        })
      })

      if (!response.ok) {
        toast.error('Failed to toggle cooling system: ' + response.statusText)
        return
      }

      setCoolingStatus(checked)
      toast.success(`Cooling system ${checked ? 'activated' : 'deactivated'}`)
    } catch (err: any) {
      toast.error('An error occurred while toggling cooling system: ' + (err.message || 'Unknown error'))
    } finally {
      setIsToggling(false)
    }
  }

  // Handle level change (only updates local state)
  const handleLevelChange = (value: number) => {
    setCoolingLevel(value)
    setHasUnsavedChanges(value !== savedCoolingLevel) // Confronta con l'ultimo valore salvato
  }

  // Handle save button click
  const handleSave = async () => {
    
    setIsSaving(true)
    try {
      const response = await fetch(`${API_URL}/proxy/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: {
            level: coolingLevel
          },
          object_id: smartObject.id,
          room_id: smartObject.room_id,
        })
      })

      if (!response.ok) {
        toast.error('Failed to save cooling level: ' + response.statusText)
        return
      }

      setHasUnsavedChanges(false)
      setSavedCoolingLevel(coolingLevel) // Aggiorna il valore di riferimento dopo il salvataggio
      toast.success('Cooling level saved successfully')
    } catch (err: any) {
      toast.error('An error occurred while saving cooling level: ' + (err.message || 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

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
            <div className="flex items-center gap-2">
              {isToggling && <RefreshCw className="h-4 w-4 animate-spin" />}
              <Switch 
                checked={coolingStatus} 
                onCheckedChange={handleToggle}
                disabled={isToggling}
              />
            </div>
          </div>

          {coolingStatus && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3">Cooling Level: {coolingLevel}</Label>
                <Slider
                  value={[coolingLevel]}
                  onValueChange={(value) => handleLevelChange(value[0])}
                  max={coolingActuator?.max_level || 5}
                  min={1}
                  step={1}
                  className="mt-2"
                  disabled={isToggling}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Min (1)</span>
                  <span>Max ({coolingActuator?.max_level || 5})</span>
                </div>
              </div>
              
              {hasUnsavedChanges && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-orange-600">You have unsaved changes</p>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
