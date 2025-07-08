"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  AlertTriangle,
  Edit,
  Plus,
  Settings,
  Trash2,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  ACTION_TYPE_LABELS,
  OPERATOR_LABELS,
  Policy,
  PolicyAction,
  PolicyCondition,
  SENSOR_TYPE_LABELS,
} from "@/types/policy";
import { SmartObject } from "@/types/smartobject";
import { findSensorById, formatName, formatType } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { toast } from "sonner";

interface PolicyDialogProps {
  smartObjects: SmartObject[];
  roomId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.1:5000/hvac/api"

export function PolicyDialog({ smartObjects, roomId }: PolicyDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSmartObject, setSelectedSmartObject] = useState<SmartObject | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Stato per la nuova policy
  const [newPolicy, setNewPolicy] = useState<Omit<Policy, "id">>({
    description: "",
    room_id: roomId || "",
    rack_id: null,
    object_id: "",
    sensor_type: "",
    resource_id: "",
    condition: {
      operator: "<",
      value: 0,
    },
    action: {
      resource_id: "",
      actuator_type: "",
      command: {
        status: "OFF",
        speed: 0,
      },
    },
  });

  // Sensori e attuatori disponibili da tutti gli smart object nella room
  const availableSensors = smartObjects.flatMap(obj =>
    (obj.sensors || []).map(sensor => ({
      ...sensor,
      smartObjectId: obj.id,
      smartObjectName: formatName(obj.id),
      rackId: obj.rack_id
    }))
  );
  const availableActuators = smartObjects.flatMap(obj =>
    (obj.actuators || []).map(actuator => ({
      ...actuator,
      smartObjectId: obj.id,
      smartObjectName: formatName(obj.id),
      rackId: obj.rack_id
    }))
  );

  // richiesta policy a /room/:roomId/rack/:rackId/device/:deviceId/policy
  const [policies, setPolicies] = useState<Policy[]>([]);

  // Carica le policy solo quando il dialogo viene aperto
  useEffect(() => {
    if (!dialogOpen) return; // Non caricare se il dialogo non è aperto

    const loadPolicies = async () => {
      if (!roomId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/room/${roomId}/policies`);
        if (response.ok) {
          const data = await response.json();
          // Rimuovi duplicati basandoti sull'ID per evitare errori di chiavi duplicate
          const uniquePolicies = (data.policies || []).filter((policy: Policy, index: number, array: Policy[]) => 
            array.findIndex(p => p.id === policy.id) === index
          );
          setPolicies(uniquePolicies);
        } else {
          toast.error("Errore nel caricamento delle policy");
          setPolicies([]);
        }
      } catch (error) {
        toast.error("Errore nella richiesta: " + error);
        setPolicies([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Caricamento iniziale
    loadPolicies();
  }, [dialogOpen, roomId]);

  // Helper function to find sensor across all smart objects
  const findSensorByIdInRoom = (resourceId: string) => {
    for (const smartObj of smartObjects) {
      const sensor = findSensorById(smartObj, resourceId);
      if (sensor) return sensor;
    }
    return null;
  };

  const getConditionText = (condition: PolicyCondition) => {
    return `${OPERATOR_LABELS[condition.operator]}: ${condition.value}`;
  };

  const getActionText = (action: PolicyAction) => {
    const commands = Object.entries(action.command)
      .filter(([key]) => key !== "event_type" && key !== "event_data")
      .map(
        ([key, value]) =>
          `${ACTION_TYPE_LABELS[key as keyof typeof ACTION_TYPE_LABELS] || key
          }: ${value}`
      )
      .join("\n");
    return commands || "Nessuna azione";
  };

  // Funzione per iniziare l'editing di una policy
  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy({ ...policy });
  };

  // Funzione per salvare le modifiche alla policy
  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return;

    try {
      const response = await fetch(
        `${API_URL}/room/${roomId}/policies`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingPolicy),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setPolicies((prev) =>
          prev.map((p) => (p.id === editingPolicy.id ? result.policy : p))
        );
        setEditingPolicy(null);
      } else {
        const errorData = await response.json();
        toast.error("Errore nel salvataggio della policy: " + (errorData.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      toast.error("Errore nella richiesta: " + error);
    }
  };

  // Funzione per eliminare una policy
  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa policy?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/room/${roomId}/policies?id=${policyId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setPolicies((prev) => prev.filter((p) => p.id !== policyId));
      } else {
        const errorData = await response.json();
        toast.error("Errore nell'eliminazione della policy: " + (errorData.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      toast.error("Errore nella richiesta: " + error);
    }
  };

  // Funzione per creare una nuova policy
  const handleCreatePolicy = async () => {
    if (!newPolicy.object_id) return;

    try {
      const response = await fetch(
        `${API_URL}/room/${roomId}/policies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newPolicy),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setPolicies((prev) => [...prev, result.policy]);
        setIsCreating(false);
        // Reset del form
        setNewPolicy({
          description: "",
          room_id: roomId || "",
          rack_id: null,
          object_id: "",
          sensor_type: "",
          resource_id: "",
          condition: {
            operator: "<",
            value: 0,
          },
          action: {
            resource_id: "",
            actuator_type: "",
            command: {
              status: "OFF",
              speed: 0,
            },
          },
        });
      } else {
        const errorData = await response.json();
        toast.error("Errore nella creazione della policy: " + (errorData.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      toast.error("Errore nella richiesta: " + error);
    }
  };

  // Funzioni helper per aggiornare la nuova policy
  const updateNewPolicyCondition = (
    field: keyof PolicyCondition,
    value: any
  ) => {
    setNewPolicy((prev) => ({
      ...prev,
      condition: { ...prev.condition, [field]: value },
    }));
  };

  const updateNewPolicyAction = (field: string, value: any) => {
    setNewPolicy((prev) => ({
      ...prev,
      action: {
        ...prev.action,
        command: {
          ...prev.action.command,
          [field]: value,
        },
      },
    }));
  };

  const updateNewPolicyActionField = (
    field: "resource_id" | "actuator_type",
    value: string
  ) => {
    setNewPolicy((prev) => ({
      ...prev,
      action: {
        ...prev.action,
        [field]: value,
      },
    }));
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[50%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Policy - {formatName(roomId)}</DialogTitle>
          <DialogDescription>
            Configure thresholds for sensors
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Existing Policy</h3>
            <Button
              onClick={() => setIsCreating(true)}
              size="sm"
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuova Policy
            </Button>
          </div>
          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-muted-foreground mt-2">
                  Caricamento policy...
                </p>
              </CardContent>
            </Card>
          ) : policies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nessuna policy configurata
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {policies.map((policy, index) => (
                <Card
                  key={`${policy.id}-${index}`}
                  className="transition-all duration-200 hover:shadow-md border-l-4 border-l-blue-400 bg-blue-50/70 opacity-75"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-row gap-2 space-y-1 items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200 text-blue-800 mr-3">
                          <Settings className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {formatType(policy.sensor_type)
                              .charAt(0)
                              .toUpperCase() +
                              formatType(policy.sensor_type).slice(1)}{" "}
                            Sensor
                          </CardTitle>
                          <CardDescription>
                            {policy.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPolicy(policy)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePolicy(policy.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <Label className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                            Condition Trigger
                          </Label>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-300 min-h-[50px]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <Activity className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-blue-900">
                                {formatType(policy.sensor_type)
                                  .charAt(0)
                                  .toUpperCase() +
                                  formatType(policy.sensor_type).slice(1)}
                              </div>
                              <div className="text-lg font-bold text-blue-700">
                                {getConditionText(policy.condition)}{" "}
                                {
                                  findSensorByIdInRoom(policy.resource_id)?.unit
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          <Label className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                            Automatic Action
                          </Label>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-300 min-h-[60px]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-orange-900">
                                {formatType(policy.action.actuator_type)
                                  .charAt(0)
                                  .toUpperCase() +
                                  formatType(policy.action.actuator_type).slice(
                                    1
                                  )}{" "}
                                Actuator
                              </div>
                              <pre className="text-sm font-semibold text-orange-700 whitespace-pre-line">
                                {getActionText(policy.action)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Form Modifica Policy Esistente */}
          {editingPolicy && (
            <Card>
              <CardHeader>
                <CardTitle>Modify Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    placeholder="Describe what this policy does..."
                    value={editingPolicy.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditingPolicy((prev) =>
                        prev ? { ...prev, description: e.target.value } : null
                      )
                    }
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sensor</Label>
                  <Select
                    value={editingPolicy.resource_id}
                    onValueChange={(value) => {
                      const selectedSensor = availableSensors.find(
                        (s) => s.resource_id === value
                      );
                      setEditingPolicy((prev) =>
                        prev
                          ? {
                            ...prev,
                            resource_id: value,
                            sensor_type: selectedSensor?.type || "",
                            object_id: selectedSensor?.smartObjectId || "",
                            rack_id: selectedSensor?.rackId || null,
                          }
                          : null
                      );
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleziona sensore" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSensors.map((sensor) => (
                        <SelectItem
                          key={sensor.resource_id}
                          value={sensor.resource_id}
                        >
                          {formatName(sensor.resource_id)} -{" "}
                          {formatType(sensor.type).charAt(0).toUpperCase() +
                            formatType(sensor.type).slice(1)}{" "}
                          Sensor ({sensor.smartObjectName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-threshold-value">Valore Soglia</Label>
                    <Input
                      id="edit-threshold-value"
                      type="number"
                      step="0.1"
                      value={editingPolicy.condition.value || ""}
                      min={
                        findSensorByIdInRoom(editingPolicy.resource_id)?.min || 0
                      }
                      max={
                        findSensorByIdInRoom(editingPolicy.resource_id)?.max || 100
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingPolicy((prev) =>
                          prev
                            ? {
                              ...prev,
                              condition: {
                                ...prev.condition,
                                value: value === "" ? 0 : Number.parseFloat(value) || 0,
                              },
                            }
                            : null
                        );
                      }}
                    ></Input>
                    <div className="text-xs text-muted-foreground">
                      Thresholds Sensor:{" "}
                      {findSensorByIdInRoom(editingPolicy.resource_id)?.min}{" "}
                      {findSensorByIdInRoom(editingPolicy.resource_id)?.unit}{" "}
                      -{" "}
                      {findSensorByIdInRoom(editingPolicy.resource_id)?.max}{" "}
                      {findSensorByIdInRoom(editingPolicy.resource_id)?.unit}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={editingPolicy.condition.operator}
                      onValueChange={(value) =>
                        setEditingPolicy((prev) =>
                          prev
                            ? {
                              ...prev,
                              condition: {
                                ...prev.condition,
                                operator: value as any,
                              },
                            }
                            : null
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona operatore" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
                          <SelectItem key={op} value={op}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>


                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Action to Execute
                  </Label>

                  <div className="space-y-2">
                    <Label>Actuator</Label>
                    <Select
                      value={editingPolicy.action.resource_id}
                      onValueChange={(value) => {
                        const selectedActuator = availableActuators.find(
                          (a) => a.resource_id === value
                        );
                        setEditingPolicy((prev) => {
                          if (!prev) return null;
                          const actuatorType = selectedActuator?.type || "";

                          // Inizializza il comando appropriato
                          let newCommand: any = { status: "OFF" };
                          if (actuatorType === "fan_actuator") {
                            newCommand.speed = 0;
                          } else if (actuatorType === "cooling_level_actuator") {
                            newCommand.level = 0;
                          }

                          return {
                            ...prev,
                            action: {
                              ...prev.action,
                              resource_id: value,
                              actuator_type: actuatorType,
                              command: newCommand,
                            },
                          };
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona attuatore" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableActuators.map((actuator) => (
                          <SelectItem
                            key={actuator.resource_id}
                            value={actuator.resource_id}
                          >
                            {formatName(actuator.resource_id)} -{" "}
                            {formatType(actuator.type).charAt(0).toUpperCase() +
                              formatType(actuator.type).slice(1)}{" "}
                            Actuator ({actuator.smartObjectName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Stato</Label>
                      <Select
                        value={editingPolicy.action.command.status || ""}
                        onValueChange={(value) =>
                          setEditingPolicy((prev) =>
                            prev
                              ? {
                                ...prev,
                                action: {
                                  ...prev.action,
                                  command: {
                                    ...prev.action.command,
                                    status: value as any,
                                  },
                                },
                              }
                              : null
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona stato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ON">Accendi</SelectItem>
                          <SelectItem value="OFF">Spegni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Velocità</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={editingPolicy.action.command.speed || ""}
                        disabled={editingPolicy.action.actuator_type === "iot:actuator:cooling_levels"}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === "" ? 0 : Number.parseInt(value) || 0;
                          setEditingPolicy((prev) => {
                            if (!prev) return null;

                            return {
                              ...prev,
                              action: {
                                ...prev.action,
                                command: {
                                  ...prev.action.command,
                                  speed: numValue,
                                },
                              },
                            };
                          });
                        }}
                      />
                      {editingPolicy.action.actuator_type === "iot:actuator:cooling_levels" && (
                        <p className="text-xs text-muted-foreground">
                          Not available for this type of actuator
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Livello</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={editingPolicy.action.command.level || ""}
                        disabled={editingPolicy.action.actuator_type === "iot:actuator:pump" || editingPolicy.action.actuator_type === "iot:actuator:fan"}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === "" ? 0 : Number.parseInt(value) || 0;
                          setEditingPolicy((prev) => {
                            if (!prev) return null;

                            return {
                              ...prev,
                              action: {
                                ...prev.action,
                                command: {
                                  ...prev.action.command,
                                  level: numValue,
                                },
                              },
                            };
                          });
                        }}
                      />
                      {(editingPolicy.action.actuator_type === "iot:actuator:fan" || editingPolicy.action.actuator_type === "iot:actuator:pump") && (
                        <p className="text-xs text-muted-foreground">
                          Not available for this type of actuator
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingPolicy(null)}
                    >
                      Annulla
                    </Button>
                    <Button onClick={handleUpdatePolicy}>
                      Salva Modifiche
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Creazione Nuova Policy */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>Nuova Policy</CardTitle>
                <CardDescription>
                  Configura una nuova policy automatica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <textarea
                    id="description"
                    placeholder="Descrivi cosa fa questa policy..."
                    value={newPolicy.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewPolicy((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sensore</Label>
                  <Select
                    value={newPolicy.resource_id}
                    onValueChange={(value) => {
                      const selectedSensor = availableSensors.find(
                        (s) => s.resource_id === value
                      );
                      setNewPolicy((prev) => ({
                        ...prev,
                        resource_id: value,
                        sensor_type: selectedSensor?.type || "",
                        object_id: selectedSensor?.smartObjectId || "",
                        rack_id: selectedSensor?.rackId || null,
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleziona sensore" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSensors.map((sensor) => (
                        <SelectItem
                          key={sensor.resource_id}
                          value={sensor.resource_id}
                        >
                          {formatName(sensor.resource_id)} -{" "}
                          {formatType(sensor.type).charAt(0).toUpperCase() +
                            formatType(sensor.type).slice(1)}{" "}
                          Sensor ({sensor.smartObjectName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="threshold-value">Valore Soglia</Label>
                    <Input
                      id="threshold-value"
                      type="number"
                      step="0.1"
                      value={newPolicy.condition.value || ""}
                      min={
                        findSensorByIdInRoom(newPolicy.resource_id)?.min || 0
                      }
                      max={
                        findSensorByIdInRoom(newPolicy.resource_id)?.max || 100
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        updateNewPolicyCondition(
                          "value",
                          value === "" ? 0 : Number.parseFloat(value) || 0
                        );
                      }}
                    />
                    <div className="text-xs text-muted-foreground">
                      Thresholds Sensor:{" "}
                      {findSensorByIdInRoom(newPolicy.resource_id)?.min}{" "}
                      {findSensorByIdInRoom(newPolicy.resource_id)?.unit}{" "}
                      -{" "}
                      {findSensorByIdInRoom(newPolicy.resource_id)?.max}{" "}
                      {findSensorByIdInRoom(newPolicy.resource_id)?.unit}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Operatore</Label>
                    <Select
                      value={newPolicy.condition.operator}
                      onValueChange={(value) =>
                        updateNewPolicyCondition("operator", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona operatore" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
                          <SelectItem key={op} value={op}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Action to Execute
                  </Label>

                  <div className="space-y-2">
                    <Label>Attuatore</Label>
                    <Select
                      value={newPolicy.action.resource_id}
                      onValueChange={(value) => {
                        const selectedActuator = availableActuators.find(
                          (a) => a.resource_id === value
                        );
                        const actuatorType = selectedActuator?.type || "";

                        // Inizializza il comando appropriato
                        let newCommand: any = { status: "OFF" };
                        if (actuatorType === "fan_actuator") {
                          newCommand.speed = 0;
                        } else if (actuatorType === "cooling_level_actuator") {
                          newCommand.level = 0;
                        }

                        setNewPolicy((prev) => ({
                          ...prev,
                          action: {
                            ...prev.action,
                            resource_id: value,
                            actuator_type: actuatorType,
                            command: newCommand,
                          },
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona attuatore" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableActuators.map((actuator) => (
                          <SelectItem
                            key={actuator.resource_id}
                            value={actuator.resource_id}
                          >
                            {formatName(actuator.resource_id)} -{" "}
                            {formatType(actuator.type).charAt(0).toUpperCase() +
                              formatType(actuator.type).slice(1)}{" "}
                            Actuator ({actuator.smartObjectName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Stato</Label>
                      <Select
                        value={newPolicy.action.command.status || ""}
                        onValueChange={(value) =>
                          updateNewPolicyAction("status", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona stato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ON">Accendi</SelectItem>
                          <SelectItem value="OFF">Spegni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Velocità</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={newPolicy.action.command.speed || ""}
                        disabled={newPolicy.action.actuator_type === "iot:actuator:cooling_levels"}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === "" ? 0 : Number.parseInt(value) || 0;
                          updateNewPolicyAction("speed", numValue);
                        }}
                      />
                      {newPolicy.action.actuator_type === "iot:actuator:cooling_levels" && (
                        <p className="text-xs text-muted-foreground">
                          Not available for this type of actuator
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Livello</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={newPolicy.action.command.level || ""}
                        disabled={newPolicy.action.actuator_type === "iot:actuator:fan" || newPolicy.action.actuator_type === "iot:actuator:pump"}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === "" ? 0 : Number.parseInt(value) || 0;
                          updateNewPolicyAction("level", numValue);
                        }}
                      />
                      {(newPolicy.action.actuator_type === "iot:actuator:fan" || newPolicy.action.actuator_type === "iot:actuator:pump") && (
                        <p className="text-xs text-muted-foreground">
                          Not available for this type of actuator
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                    >
                      Annulla
                    </Button>
                    <Button onClick={handleCreatePolicy}>Crea Policy</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
