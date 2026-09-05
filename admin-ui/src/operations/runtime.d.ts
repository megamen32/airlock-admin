export type OperationsController = { setView(view: string): void; destroy(): void };
export function mountOperations(root: HTMLElement, initialView: string, onNavigate: (view: string) => void): OperationsController;
