/**
 * TicketTracker Component Tests
 * Tests display logic for queue position, wait times, and status badges
 */
import { render, screen } from '@testing-library/react';
import TicketTracker from '@/components/queue/TicketTracker';
import { fixtures } from '../mocks/fixtures';

describe('TicketTracker', () => {
  it('should display the ticket display code', () => {
    const ticket = fixtures.ticket({ display_code: 'G-007' });
    const queue = fixtures.queue();

    render(<TicketTracker ticket={ticket} queue={queue} aheadCount={3} />);

    expect(screen.getByText('G-007')).toBeInTheDocument();
  });

  it('should show people ahead count when waiting', () => {
    const ticket = fixtures.ticket();
    const queue = fixtures.queue();

    render(<TicketTracker ticket={ticket} queue={queue} aheadCount={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('people ahead of you')).toBeInTheDocument();
  });

  it('should show "person" singular when 1 ahead', () => {
    const ticket = fixtures.ticket();
    const queue = fixtures.queue();

    render(<TicketTracker ticket={ticket} queue={queue} aheadCount={1} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('person ahead of you')).toBeInTheDocument();
  });

  it('should show "You\'re next!" when 0 ahead', () => {
    const ticket = fixtures.ticket();
    const queue = fixtures.queue();

    render(<TicketTracker ticket={ticket} queue={queue} aheadCount={0} />);

    expect(screen.getByText("You're next!")).toBeInTheDocument();
  });

  it('should calculate estimated wait time correctly', () => {
    const ticket = fixtures.ticket();
    const queue = fixtures.queue({ avg_service_time_min: 5 });

    render(<TicketTracker ticket={ticket} queue={queue} aheadCount={4} />);

    expect(screen.getByText('Estimated wait: ~20 min')).toBeInTheDocument();
  });

  it('should show "It\'s your turn!" when status is serving', () => {
    const ticket = fixtures.servingTicket();
    const queue = fixtures.queue();

    render(<TicketTracker ticket={ticket} queue={queue} aheadCount={0} />);

    expect(screen.getByText("It's your turn!")).toBeInTheDocument();
  });

  it('should show "Completed" when status is served', () => {
    const ticket = fixtures.servedTicket();
    const queue = fixtures.queue();

    render(<TicketTracker ticket={ticket} queue={queue} aheadCount={0} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should display queue name', () => {
    const ticket = fixtures.ticket();
    const queue = fixtures.queue({ name: 'Dental' });

    render(<TicketTracker ticket={ticket} queue={queue} aheadCount={2} />);

    expect(screen.getByText('Dental')).toBeInTheDocument();
  });

  it('should display queue color indicator', () => {
    const ticket = fixtures.ticket();
    const queue = fixtures.queue({ color: '#ff5733' });

    const { container } = render(<TicketTracker ticket={ticket} queue={queue} aheadCount={2} />);

    const colorDot = container.querySelector('.rounded-full');
    expect(colorDot).toBeInTheDocument();
    expect(colorDot).toHaveStyle({ backgroundColor: '#ff5733' });
  });

  it('should show 0 min estimated wait when 0 ahead', () => {
    const ticket = fixtures.ticket();
    const queue = fixtures.queue({ avg_service_time_min: 10 });

    render(<TicketTracker ticket={ticket} queue={queue} aheadCount={0} />);

    expect(screen.getByText('Estimated wait: ~0 min')).toBeInTheDocument();
  });
});
