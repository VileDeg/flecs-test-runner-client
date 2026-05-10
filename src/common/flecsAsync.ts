/* eslint-disable @typescript-eslint/no-explicit-any  */

/* esling-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore TS7019
// @ts-ignore TS7006
// @ts-nocheck

import { flecs } from "../flecs.js";

import type {
  QueriedEntity,
  QueryResponse,
  TypeInfoResponse,
} from "@common/types.ts";

export function flecsErrorMessage(error: any): string {
  const errorMessage = error.toString();
  let errorData = null;

  // Attempt to parse if it's a JSON string
  try {
    errorData = typeof error === "string" ? JSON.parse(error) : error;
  } catch (_) {
    // Not JSON, fallback to raw error
  }

  const detailedError = errorData?.error || errorMessage;
  return detailedError;
}

export function flecsError(error: any, prefix: string): Error {
  return Error(`${prefix}: ${flecsErrorMessage(error)}`);
}

/**
 * A wrapper classes enabling asynchronous execution of Flecs REST API requests.
 */
export class FlecsAsync {
  connection: any;
  isConnected: boolean = false;

  constructor(params: any) {
    this.connection = flecs.connect(params);
    this.isConnected = false;
  }

  /**
   * Wait for connection to be established.
   * @param timeoutMs Timeout.
   * @returns
   */
  async waitForConnection(timeoutMs = 5000) {
    return new Promise<void>((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, timeoutMs);

      const originalOnStatus = this.connection.params.on_status;
      this.connection.params.on_status = (status) => {
        if (originalOnStatus) originalOnStatus(status);

        if (status === flecs.ConnectionStatus.Connected) {
          clearTimeout(timeout);
          this.isConnected = true;
          resolve();
        }
      };
    });
  }

  // Generic method wrapper
  _wrapMethod(methodName: string, ...args): unknown {
    return new Promise<string>((resolve, reject) => {
      const method = (this.connection as any)[methodName];
      if (!method) {
        reject(new Error(`Method ${methodName} not found`));
        return;
      }

      // TODO: other methods without recv, err
      // Add success and error callbacks
      // what about on_abort parameter?
      const newArgs = [...args, resolve, reject];
      method.apply(this.connection, newArgs);
    });
  }

  async entity(path, params = {}): Promise<QueriedEntity> {
    return this._wrapMethod("entity", path, params);
  }

  async typeInfo(path): Promise<TypeInfoResponse> {
    return this._wrapMethod("typeInfo", path);
  }

  async create(path) {
    return this._wrapMethod("create", path);
  }

  async delete(path) {
    return this._wrapMethod("delete", path);
  }

  async add(path, component) {
    return this._wrapMethod("add", path, component);
  }

  async remove(path, component) {
    return this._wrapMethod("remove", path, component);
  }

  async set(path, component, value) {
    return this._wrapMethod("set", path, component, value);
  }

  async get(path, params = {}) {
    return this._wrapMethod("get", path, params);
  }

  // Query operations
  async query(queryString, params = {}): Promise<QueryResponse> {
    return this._wrapMethod("query", queryString, params);
  }

  // Connection management
  disconnect() {
    this.connection.disconnect();
    this.isConnected = false;
  }

  // Getters for connection info
  get status() {
    return this.connection.status;
  }
  get worldInfo() {
    return this.connection.worldInfo;
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
