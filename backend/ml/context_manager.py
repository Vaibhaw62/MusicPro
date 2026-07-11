from collections import defaultdict


class ContextManager:

    def __init__(self):

        self.sessions = defaultdict(dict)

    def update_context(
        self,
        user_id,
        data
    ):

        current = self.sessions[user_id]

        current.update(data)

        return current

    def get_context(
        self,
        user_id
    ):

        return self.sessions.get(
            user_id,
            {}
        )

    def clear_context(
        self,
        user_id
    ):

        if user_id in self.sessions:

            del self.sessions[user_id]


context_manager = ContextManager()