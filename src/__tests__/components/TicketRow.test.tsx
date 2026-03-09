/**
 * TicketRow Component Tests
 * Tests ticket row display and action buttons
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TicketRow from '@/components/queue/TicketRow';
import { fixtures } from '../mocks/fixtures';

describe('TicketRow', () => {
  it('should display ticket display code', () => {
    render(<TicketRow ticket={fixtures.ticket({ display_code: 'G-042' })} />);
    expect(screen.getByText('G-042')).toBeInTheDocument();
  });

  it('should display customer name', () => {
    render(<TicketRow ticket={fixtures.ticket({ customer_name: 'Anna Berg' })} />);
    expect(screen.getByText('Anna Berg')).toBeInTheDocument();
  });

  it('should display "Guest" when no customer name', () => {
    render(<TicketRow ticket={fixtures.ticket({ customer_name: null })} />);
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });

  it('should show Call, Snooze, No Show buttons for waiting tickets', () => {
    render(
      <TicketRow
        ticket={fixtures.ticket()}
        onCall={jest.fn().mockResolvedValue({ error: null })}
        onSnooze={jest.fn().mockResolvedValue({ error: null })}
        onNoShow={jest.fn().mockResolvedValue({ error: null })}
      />
    );

    expect(screen.getByText('Call')).toBeInTheDocument();
    expect(screen.getByText('Snooze')).toBeInTheDocument();
    expect(screen.getByText('No Show')).toBeInTheDocument();
  });

  it('should show Complete button for serving tickets', () => {
    render(
      <TicketRow
        ticket={fixtures.servingTicket()}
        onComplete={jest.fn().mockResolvedValue({ error: null })}
      />
    );

    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.queryByText('Call')).not.toBeInTheDocument();
  });

  it('should not show action buttons for served tickets', () => {
    render(<TicketRow ticket={fixtures.servedTicket()} />);

    expect(screen.queryByText('Call')).not.toBeInTheDocument();
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
    expect(screen.queryByText('Snooze')).not.toBeInTheDocument();
  });

  it('should call onCall handler when Call button is clicked', async () => {
    const onCall = jest.fn().mockResolvedValue({ error: null });
    render(
      <TicketRow
        ticket={fixtures.ticket()}
        onCall={onCall}
        onSnooze={jest.fn().mockResolvedValue({ error: null })}
        onNoShow={jest.fn().mockResolvedValue({ error: null })}
      />
    );

    fireEvent.click(screen.getByText('Call'));

    await waitFor(() => expect(onCall).toHaveBeenCalledTimes(1));
  });

  it('should call onComplete handler when Complete button is clicked', async () => {
    const onComplete = jest.fn().mockResolvedValue({ error: null });
    render(
      <TicketRow
        ticket={fixtures.servingTicket()}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('Complete'));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('should show error message when action fails', async () => {
    const onCall = jest.fn().mockResolvedValue({ error: { message: 'Failed' } });
    render(
      <TicketRow
        ticket={fixtures.ticket()}
        onCall={onCall}
        onSnooze={jest.fn().mockResolvedValue({ error: null })}
        onNoShow={jest.fn().mockResolvedValue({ error: null })}
      />
    );

    fireEvent.click(screen.getByText('Call'));

    await waitFor(() => {
      expect(screen.getByText(/Call failed/)).toBeInTheDocument();
    });
  });

  it('should show error message when action throws', async () => {
    const onNoShow = jest.fn().mockRejectedValue(new Error('Network error'));
    render(
      <TicketRow
        ticket={fixtures.ticket()}
        onCall={jest.fn().mockResolvedValue({ error: null })}
        onSnooze={jest.fn().mockResolvedValue({ error: null })}
        onNoShow={onNoShow}
      />
    );

    fireEvent.click(screen.getByText('No Show'));

    await waitFor(() => {
      expect(screen.getByText(/No Show failed/)).toBeInTheDocument();
    });
  });
});
