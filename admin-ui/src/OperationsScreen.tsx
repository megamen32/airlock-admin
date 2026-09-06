import { useEffect, useRef } from "react";
import { mountOperations, type OperationsController } from "./operations/runtime.js";
import template from "./operations/template.html?raw";
import "./operations/styles.css";

export const operationViews = ["overview", "agents", "jobs", "tools", "resources", "mcpmanage", "security", "failover", "audit", "raw"] as const;
export type OperationView = typeof operationViews[number];
export const isOperationView = (value: string): value is OperationView => (operationViews as readonly string[]).includes(value);

export default function OperationsScreen({ view, onNavigate }: { view: OperationView; onNavigate: (view: OperationView) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<OperationsController | null>(null);
  const navigation = useRef(onNavigate);
  navigation.current = onNavigate;
  const initialView = useRef(view);
  useEffect(() => {
    if (!root.current) return;
    const source = new DOMParser().parseFromString(template, "text/html");
    source.querySelectorAll("script").forEach((node) => node.remove());
    const content = document.createElement("div");
    content.innerHTML = source.body.innerHTML;
    root.current.replaceChildren(content);
    controller.current = mountOperations(content, initialView.current, (next) => {
      if (isOperationView(next)) navigation.current(next);
    });
    return () => { controller.current?.destroy(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setView(view); }, [view]);
  return <div ref={root} className="operations-console" aria-label="Операционная панель" />;
}
