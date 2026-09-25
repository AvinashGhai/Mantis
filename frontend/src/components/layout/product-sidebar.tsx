"use client";

import { AirVent, Bike, RotateCcw, WashingMachine, Wrench } from "lucide-react";
import { Product } from "@/lib/types";

interface ProductSidebarProps {
  products: Product[];
  selected: Product;
  onSelect: (product: Product) => void;
  onReset: () => void;
}

const ICONS: Record<Product["icon"], typeof Bike> = {
  scooter: Bike,
  ac: AirVent,
  washer: WashingMachine,
};

export function ProductSidebar({ products, selected, onSelect, onReset }: ProductSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-6 border-r border-line bg-surface px-4 py-5">
      <div className="flex items-center gap-2 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-dim text-signal">
          <Wrench className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-base font-semibold leading-none text-text">Mantis</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Product expert</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="px-1 text-xs uppercase tracking-[0.18em] text-text-muted">Your products</p>
        {products.map((product) => {
          const Icon = ICONS[product.icon] ?? Bike;
          const isActive = product.id === selected.id;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                isActive
                  ? "border-signal/40 bg-signal-dim"
                  : "border-line bg-surface-2 hover:border-line-strong"
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isActive ? "bg-signal text-canvas" : "bg-surface-3 text-text-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className={`text-sm ${isActive ? "text-text" : "text-text-muted"}`}>{product.name}</span>
                <span className="text-xs text-text-faint">{product.category}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-3 rounded-xl border border-line bg-surface-2 p-3">
        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Maintenance</p>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Last service</span>
            <span className="font-mono text-text">{selected.lastService}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Next due</span>
            <span className="font-mono text-confirm">{selected.nextService}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center justify-center gap-2 rounded-xl border border-line bg-transparent px-3 py-2.5 text-sm text-text-muted transition-colors hover:border-line-strong hover:text-text"
      >
        <RotateCcw className="h-4 w-4" />
        New diagnosis
      </button>
    </div>
  );
}
