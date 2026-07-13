import fs from "fs";
import path from "path";
import { Product, ChannelPost } from "../types";

export interface PriceSnapshot {
  productId: string;
  title: string;
  price: number;
  medianPrice: number;
  honestDiscountPercent: number;
  source: string;
  capturedAt: string;
}

export interface RuntimeAuditRun {
  id: string;
  type: "onliner_analysis" | "onliner_doctor" | "channel_publish";
  trigger: "manual" | "scheduler" | "telegram" | "system";
  status: "success" | "degraded" | "failed" | "skipped";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  query?: string;
  productId?: string;
  productsFound?: number;
  postsCreated?: number;
  published?: boolean;
  source?: string;
  cacheHit?: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

interface RuntimeState {
  version: 1;
  updatedAt: string;
  products: Record<string, Product>;
  priceSnapshots: Record<string, PriceSnapshot[]>;
  channelPosts: ChannelPost[];
  auditRuns: RuntimeAuditRun[];
}

const emptyState = (): RuntimeState => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  products: {},
  priceSnapshots: {},
  channelPosts: [],
  auditRuns: [],
});

function readState(statePath: string): RuntimeState {
  if (!fs.existsSync(statePath)) return emptyState();

  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8")) as Partial<RuntimeState>;
    return {
      ...emptyState(),
      ...parsed,
      products: parsed.products || {},
      priceSnapshots: parsed.priceSnapshots || {},
      channelPosts: parsed.channelPosts || [],
      auditRuns: parsed.auditRuns || [],
    };
  } catch {
    return emptyState();
  }
}

function writeStateAtomic(statePath: string, state: RuntimeState) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  state.updatedAt = new Date().toISOString();
  const tmpPath = `${statePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmpPath, statePath);
}

export function createRuntimeStore(statePath = process.env.RUNTIME_STATE_PATH || path.join(process.cwd(), "data", "runtime-state.json")) {
  let state = readState(statePath);

  const save = () => writeStateAtomic(statePath, state);

  return {
    statePath,

    upsertProduct(product: Product) {
      state.products[product.id] = product;
      save();
    },

    recordPriceSnapshot(product: Product) {
      const snapshot: PriceSnapshot = {
        productId: product.id,
        title: product.title,
        price: product.currentPrice,
        medianPrice: product.medianPrice90Days,
        honestDiscountPercent: product.honestDiscountPercent,
        source: product.dataSource || "unknown",
        capturedAt: product.lastCheckedAt || new Date().toISOString(),
      };

      const list = state.priceSnapshots[product.id] || [];
      const last = list[list.length - 1];
      if (!last || last.price !== snapshot.price || last.medianPrice !== snapshot.medianPrice) {
        list.push(snapshot);
        state.priceSnapshots[product.id] = list.slice(-720);
      }

      state.products[product.id] = product;
      save();
      return snapshot;
    },

    addChannelPost(post: ChannelPost) {
      state.channelPosts = [post, ...state.channelPosts.filter((item) => item.id !== post.id)].slice(0, 200);
      save();
    },

    addAuditRun(run: RuntimeAuditRun) {
      state.auditRuns = [run, ...state.auditRuns.filter((item) => item.id !== run.id)].slice(0, 500);
      save();
    },

    getProduct(id: string) {
      return state.products[id] || null;
    },

    listProducts() {
      return Object.values(state.products);
    },

    listChannelPosts(limit = 25) {
      return state.channelPosts.slice(0, limit);
    },

    listAuditRuns(limit = 25, type?: RuntimeAuditRun["type"]) {
      const runs = type ? state.auditRuns.filter((run) => run.type === type) : state.auditRuns;
      return runs.slice(0, limit);
    },

    getStats() {
      const snapshotsCount = Object.values(state.priceSnapshots).reduce((sum, list) => sum + list.length, 0);
      const realDealsTracked = Object.values(state.products).filter(
        (product) => product.honestDiscountPercent >= 20 && !product.isFakeDiscount,
      ).length;

      return {
        statePath,
        productsCount: Object.keys(state.products).length,
        snapshotsCount,
        channelPostsCount: state.channelPosts.length,
        auditRunsCount: state.auditRuns.length,
        lastAuditRun: state.auditRuns[0] || null,
        realDealsTracked,
        updatedAt: state.updatedAt,
      };
    },
  };
}
