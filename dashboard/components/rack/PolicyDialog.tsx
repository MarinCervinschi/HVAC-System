"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Settings } from "lucide-react"
import { type SmartObject, type Sensor } from "@/lib/datacenter-data"

interface PolicyDialogProps {
    smartObject: SmartObject
    getSensorPolicy: (sensor: Sensor) => { min: number; max: number }
    onPolicyChange: (sensorId: string, policy: { min: number; max: number }) => void
}

export function PolicyDialog({ smartObject, getSensorPolicy, onPolicyChange }: PolicyDialogProps) {
    const sensorsWithPolicies = smartObject.sensors.filter((sensor) => sensor.policy)

    if (sensorsWithPolicies.length === 0) return null

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Policy {smartObject.name}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Policy - {smartObject.name}</DialogTitle>
                    <DialogDescription>Configura le soglie per i sensori</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {sensorsWithPolicies.map((sensor) => {
                        const policy = getSensorPolicy(sensor)
                        return (
                            <div key={sensor.id} className="space-y-2">
                                <Label>
                                    {sensor.name} ({sensor.unit})
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label htmlFor={`${sensor.id}-min`} className="text-xs">
                                            Min
                                        </Label>
                                        <Input
                                            id={`${sensor.id}-min`}
                                            type="number"
                                            value={policy.min}
                                            onChange={(e) =>
                                                onPolicyChange(sensor.id, {
                                                    ...policy,
                                                    min: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`${sensor.id}-max`} className="text-xs">
                                            Max
                                        </Label>
                                        <Input
                                            id={`${sensor.id}-max`}
                                            type="number"
                                            value={policy.max}
                                            onChange={(e) =>
                                                onPolicyChange(sensor.id, {
                                                    ...policy,
                                                    max: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <Button>Salva Policy</Button>
            </DialogContent>
        </Dialog>
    )
}
