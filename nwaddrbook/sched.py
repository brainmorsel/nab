import heapq


class TimeoutScheduler:
    REMOVED = '<removed-task>'  # placeholder for a removed task

    def __init__(self):
        self.pq = []                      # list of entries arranged in a heap
        self.entry_finder = {}            # mapping of tasks to entries

    def add(self, timeout, id, data=None):
        'Add a new task or update the priority of an existing task'
        if id in self.entry_finder:
            self.remove(id)
        entry = [timeout, id, data]
        self.entry_finder[id] = entry
        heapq.heappush(self.pq, entry)

    def remove(self, id):
        'Mark an existing task as REMOVED.  Raise KeyError if not found.'
        entry = self.entry_finder.pop(id)
        entry[1] = self.REMOVED

    def pop(self, deadline=0):
        'Remove and return the task which reached deadline. Raise KeyError if nothing to return.'
        while self.pq:
            timeout, id, data = self.pq[0]
            if timeout >= deadline:
                raise KeyError('there is no ready tasks')
            heapq.heappop(self.pq)
            if id is not self.REMOVED:
                del self.entry_finder[id]
                return (timeout, id, data)
        raise KeyError('pop from an empty TimeoutScheduler')

    def next_timeout(self):
        for timeout, id, _ in self.pq:
            if id is not self.REMOVED:
                return timeout
        else:
            raise KeyError('getting next timeout from an empty TimeoutScheduler')
