import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EcoPulseAI from '../EcoPulseAI';

describe('EcoPulseAI', () => {
  const defaultProps = {
    id: 'ai-coach',
    inputs: {
      commuteDistance: 250,
      transportType: 'gasoline',
      flightHours: 10,
      electricityKwh: 300,
      greenEnergyShare: 0,
      heatingSource: 'gas',
      dietType: 'averageMeat',
      shoppingHabit: 'average',
      recycles: true
    },
    footprintBreakdown: {
      total: 8000,
      transport: 3000,
      energy: 2500,
      diet: 1500,
      shopping: 1000
    },
    netFootprint: 7500,
    xp: 150,
    completedHabits: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders the chatbot component and shows the default greeting', () => {
    render(<EcoPulseAI {...defaultProps} />);
    expect(screen.getByText('EcoPulse AI')).toBeInTheDocument();
    expect(screen.getByText(/Hello! I am your EcoPulse AI Carbon Coach/i)).toBeInTheDocument();
  });

  it('loads chat messages from localStorage if they exist', () => {
    const mockHistory = [
      { id: '1', sender: 'user', text: 'Hello', timestamp: '12:00 PM' },
      { id: '2', sender: 'ai', text: 'Hi there', timestamp: '12:01 PM' }
    ];
    localStorage.setItem('ecopulse_ai_messages', JSON.stringify(mockHistory));
    
    render(<EcoPulseAI {...defaultProps} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('clears conversation history after confirmation', async () => {
    const user = userEvent.setup();
    const mockHistory = [
      { id: '1', sender: 'user', text: 'Hello Coach', timestamp: '12:00 PM' }
    ];
    localStorage.setItem('ecopulse_ai_messages', JSON.stringify(mockHistory));

    // mock confirm to true (this is done in setup.js, but let's be safe)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<EcoPulseAI {...defaultProps} />);
    expect(screen.getByText('Hello Coach')).toBeInTheDocument();

    const clearBtn = screen.getByTitle('Clear Conversation');
    await user.click(clearBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.queryByText('Hello Coach')).not.toBeInTheDocument();
    expect(screen.getByText(/Hello! I am your EcoPulse AI Carbon Coach/i)).toBeInTheDocument();
  });

  it('sends message and updates state on successful fetch response', async () => {
    const user = userEvent.setup();
    
    // Mock successful fetch API response
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'Here is some advice on transport.' }]
          }
        }
      ]
    };
    
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    render(<EcoPulseAI {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Ask your Carbon Coach anything...');
    const sendBtn = screen.getByTitle('Send Message');

    await user.type(input, 'How can I save fuel?');
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('How can I save fuel?')).toBeInTheDocument();
      expect(screen.getByText('Here is some advice on transport.')).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('/api/chat', expect.any(Object));
  });

  it('displays error message when the fetch API request fails', async () => {
    const user = userEvent.setup();
    
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Internal Server Error' } })
    });

    render(<EcoPulseAI {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Ask your Carbon Coach anything...');
    const sendBtn = screen.getByTitle('Send Message');

    await user.type(input, 'Help me');
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    });
  });
});
