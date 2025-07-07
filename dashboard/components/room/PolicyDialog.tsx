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

interface PolicyDialogProps {
  smartObjects: SmartObject[];
  roomId: string;
}

export function PolicyDialog({ smartObjects, roomId }: PolicyDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<{
    policy: Policy;
    smartObject: SmartObject;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Stato per la nuova policy
  const [newPolicy, setNewPolicy] = useState<Omit<Policy, "id">>({
    description: "",
    room_id: roomId,
    rack_id: smartObjects[0]?.rack_id || null,
    resource_id: "",
    condition: {
      operator: "<",
      value: 0,
    },
    action: {
      command: {
        value: {
          status: "OFF",
          speed: 0,
        },
      },
    },
  });
  const [newPolicySmartObjectId, setNewPolicySmartObjectId] = useState(
    smartObjects[0]?.id || ""
  );

  // policiesBySmartObject: { [smartObjectId]: Policy[] }
  const [policiesBySmartObject, setPoliciesBySmartObject] = useState<
    Record<string, Policy[]>
  >({});

  // Carica le policy di tutti gli smart object
  useEffect(() => {
    const loadAllPolicies = async () => {
      setIsLoading(true);
      const result: Record<string, Policy[]> = {};
      await Promise.all(
        smartObjects.map(async (so) => {
          try {
            const response = await fetch(
              `/api/room/${roomId}/rack/${so.rack_id || "default"}/device/${
                so.id
              }/policy`
            );
            if (response.ok) {
              const data = await response.json();
              result[so.id] = data;
            } else {
              result[so.id] = [];
            }
          } catch {
            result[so.id] = [];
          }
        })
      );
      setPoliciesBySmartObject(result);
      setIsLoading(false);
    };
    loadAllPolicies();
  }, [roomId, smartObjects]);

  const getConditionText = (condition: PolicyCondition) => {
    return `${OPERATOR_LABELS[condition.operator]}: ${condition.value}`;
  };

  const getActionText = (action: PolicyAction) => {
    const commands = Object.entries(action.command.value)
      .map(
        ([key, value]) =>
          `${
            ACTION_TYPE_LABELS[key as keyof typeof ACTION_TYPE_LABELS] || key
          }: ${value}`
      )
      .join("\n");
    return commands || "Nessuna azione";
  };

  // Funzione per iniziare l'editing di una policy
  const handleEditPolicy = (policy: Policy, smartObject: SmartObject) => {
    setEditingPolicy({ policy: { ...policy }, smartObject });
  };

  // Funzione per salvare le modifiche alla policy
  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return;
    const { policy, smartObject } = editingPolicy;
    try {
      const response = await fetch(
        `/api/room/${roomId}/rack/${smartObject.rack_id}/device/${smartObject.id}/policy/${policy.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(policy),
        }
      );
      if (response.ok) {
        const updatedPolicy = await response.json();
        setPoliciesBySmartObject((prev) => ({
          ...prev,
          [smartObject.id]: prev[smartObject.id].map((p) =>
            p.id === policy.id ? updatedPolicy : p
          ),
        }));
        setEditingPolicy(null);
      }
    } catch {}
  };

  // Funzione per eliminare una policy
  const handleDeletePolicy = async (
    policyId: string,
    smartObject: SmartObject
  ) => {
    if (!confirm("Sei sicuro di voler eliminare questa policy?")) return;
    try {
      const response = await fetch(
        `/api/room/${roomId}/rack/${smartObject.rack_id}/device/${smartObject.id}/policy/${policyId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setPoliciesBySmartObject((prev) => ({
          ...prev,
          [smartObject.id]: prev[smartObject.id].filter(
            (p) => p.id !== policyId
          ),
        }));
      }
    } catch {}
  };

  // Funzione per creare una nuova policy
  const handleCreatePolicy = async () => {
    const smartObject = smartObjects.find(
      (so) => so.id === newPolicySmartObjectId
    );
    if (!smartObject) return;
    try {
      const response = await fetch(
        `/api/room/${roomId}/rack/${smartObject.rack_id}/device/${smartObject.id}/policy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPolicy),
        }
      );
      if (response.ok) {
        const createdPolicy = await response.json();
        setPoliciesBySmartObject((prev) => ({
          ...prev,
          [smartObject.id]: [...(prev[smartObject.id] || []), createdPolicy],
        }));
        setIsCreating(false);
        setNewPolicy({
          description: "",
          room_id: roomId,
          rack_id: smartObject.rack_id || null,
          resource_id: "",
          condition: { operator: "<", value: 0 },
          action: { command: { value: { status: "OFF", speed: 0 } } },
        });
      }
    } catch {}
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
        command: {
          value: { ...prev.action.command.value, [field]: value },
        },
      },
    }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[50%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Policy - Tutti gli Smart Object</DialogTitle>
          <DialogDescription>
            Configura thresholds per tutti i sensori
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Policy per tutti gli Smart Object
            </h3>
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
          ) : (
            smartObjects.map((smartObject) => (
              <div key={smartObject.id} className="mb-6">
                <h4 className="font-semibold mb-2">
                  {formatName(smartObject.id)}
                </h4>
                {(policiesBySmartObject[smartObject.id]?.length ?? 0) === 0 ? (
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
                    {policiesBySmartObject[smartObject.id]?.map((policy) => (
                      <Card
                        key={policy.id}
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
                                  {(() => {
                                    const sensor = findSensorById(
                                      smartObject,
                                      policy.resource_id
                                    );
                                    const sensorType = sensor
                                      ? formatType(sensor.type)
                                      : policy.resource_id;
                                    return (
                                      SENSOR_TYPE_LABELS[
                                        sensorType as keyof typeof SENSOR_TYPE_LABELS
                                      ] || sensorType
                                    );
                                  })()}
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
                                onClick={() =>
                                  handleEditPolicy(policy, smartObject)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeletePolicy(policy.id, smartObject)
                                }
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
                                      {(() => {
                                        const sensor = findSensorById(
                                          smartObject,
                                          policy.resource_id
                                        );
                                        return sensor
                                          ? formatType(sensor.type)
                                          : "-";
                                      })()}
                                    </div>
                                    <div className="text-md font-bold text-blue-700">
                                      {getConditionText(policy.condition)}{" "}
                                      {
                                        findSensorById(
                                          smartObject,
                                          policy.resource_id
                                        )?.unit
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
              </div>
            ))
          )}

          {/* Form Modifica Policy Esistente */}
          {editingPolicy && (
            <Card>
              <CardHeader>
                <CardTitle>Modifica Policy</CardTitle>
                <CardDescription>Modifica la policy esistente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descrizione</Label>
                  <textarea
                    id="edit-description"
                    placeholder="Descrivi cosa fa questa policy..."
                    value={editingPolicy.policy.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditingPolicy((prev) =>
                        prev
                          ? {
                              ...prev,
                              policy: {
                                ...prev.policy,
                                description: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sensore</Label>
                    <Select
                      value={editingPolicy.policy.resource_id}
                      onValueChange={(value) => {
                        setEditingPolicy((prev) =>
                          prev
                            ? {
                                ...prev,
                                policy: { ...prev.policy, resource_id: value },
                              }
                            : null
                        );
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona sensore" />
                      </SelectTrigger>
                      <SelectContent>
                        {editingPolicy.smartObject.sensors?.map((sensor) => (
                          <SelectItem
                            key={sensor.resource_id}
                            value={sensor.resource_id}
                          >
                            {sensor.resource_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Operatore</Label>
                    <Select
                      value={editingPolicy.policy.condition.operator}
                      onValueChange={(value) =>
                        setEditingPolicy((prev) =>
                          prev
                            ? {
                                ...prev,
                                policy: {
                                  ...prev.policy,
                                  condition: {
                                    ...prev.policy.condition,
                                    operator: value as any,
                                  },
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
                <div className="space-y-2">
                  <Label htmlFor="edit-threshold-value">Valore Soglia</Label>
                  <Input
                    id="edit-threshold-value"
                    type="number"
                    step="0.1"
                    value={editingPolicy.policy.condition.value}
                    onChange={(e) =>
                      setEditingPolicy((prev) =>
                        prev
                          ? {
                              ...prev,
                              policy: {
                                ...prev.policy,
                                condition: {
                                  ...prev.policy.condition,
                                  value: Number.parseFloat(e.target.value),
                                },
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Azione da Eseguire
                  </Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Stato</Label>
                      <Select
                        value={
                          editingPolicy.policy.action.command.value.status || ""
                        }
                        onValueChange={(value) =>
                          setEditingPolicy((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  policy: {
                                    ...prev.policy,
                                    action: {
                                      command: {
                                        value: {
                                          ...prev.policy.action.command.value,
                                          status: value as any,
                                        },
                                      },
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
                      <Label>Velocità/Livello</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={
                          editingPolicy.policy.action.command.value.speed ||
                          editingPolicy.policy.action.command.value.level ||
                          ""
                        }
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value);
                          setEditingPolicy((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  policy: {
                                    ...prev.policy,
                                    action: {
                                      command: {
                                        value: {
                                          ...prev.policy.action.command.value,
                                          speed: value,
                                          level: value,
                                        },
                                      },
                                    },
                                  },
                                }
                              : null
                          );
                        }}
                      />
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
                  <Label>Smart Object</Label>
                  <Select
                    value={newPolicySmartObjectId}
                    onValueChange={(value) => {
                      setNewPolicySmartObjectId(value);
                      const so = smartObjects.find((obj) => obj.id === value);
                      setNewPolicy((prev) => ({
                        ...prev,
                        rack_id: so?.rack_id || null,
                        resource_id: "",
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleziona Smart Object" />
                    </SelectTrigger>
                    <SelectContent>
                      {smartObjects.map((so) => (
                        <SelectItem key={so.id} value={so.id}>
                          {formatName(so.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sensore</Label>
                    <Select
                      value={newPolicy.resource_id}
                      onValueChange={(value) => {
                        setNewPolicy((prev) => ({
                          ...prev,
                          resource_id: value,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona sensore" />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          smartObjects.find(
                            (so) => so.id === newPolicySmartObjectId
                          )?.sensors || []
                        ).map((sensor) => (
                          <SelectItem
                            key={sensor.resource_id}
                            value={sensor.resource_id}
                          >
                            {sensor.resource_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <div className="space-y-2">
                  <Label htmlFor="threshold-value">Valore Soglia</Label>
                  <Input
                    id="threshold-value"
                    type="number"
                    step="0.1"
                    value={newPolicy.condition.value}
                    onChange={(e) =>
                      updateNewPolicyCondition(
                        "value",
                        Number.parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Azione da Eseguire
                  </Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Stato</Label>
                      <Select
                        value={newPolicy.action.command.value.status || ""}
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
                      <Label>Velocità/Livello</Label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={
                          newPolicy.action.command.value.speed ||
                          newPolicy.action.command.value.level ||
                          ""
                        }
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value);
                          updateNewPolicyAction("speed", value);
                          updateNewPolicyAction("level", value);
                        }}
                      />
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
