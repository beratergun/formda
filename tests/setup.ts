import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { Blob } from 'node:buffer';

Object.defineProperty(globalThis, 'Blob', { value: Blob, configurable: true });

afterEach(cleanup);
