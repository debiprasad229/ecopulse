/**
 * Vitest Global Test Setup
 * Configures jsdom environment mocks and extends matchers.
 */
import '@testing-library/jest-dom';

// Mock canvas-confetti globally (it's a side-effect library)
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
  __esModule: true
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn().mockReturnValue(true),
});

// Clean up localStorage before each test
beforeEach(() => {
  localStorage.clear();
  document.body.className = '';
});
