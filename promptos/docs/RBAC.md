# PromptOS RBAC

Role-Based Access Control for PromptOS.

## Roles

Defined in `promptos/rbac/roles.yaml`:

| Role | Permissions |
|------|-------------|
| `admin` | read, create, update, delete, eval, publish |
| `editor` | read, create, update |
| `viewer` | read |
| `auditor` | read, eval |

## Permissions

| Permission | Description |
|------------|-------------|
| `read` | View prompts and templates |
| `create` | Create new prompts |
| `update` | Modify existing prompts |
| `delete` | Remove prompts |
| `eval` | Evaluate/test prompts (required for execute()) |
| `publish` | Deploy prompts to production |

## Users

Defined in `promptos/rbac/users.yaml`:

```yaml
- username: alice
  role: admin
  email: alice@example.com

- username: bob
  role: editor
```

## Configuring

### Add a Role

```yaml
# roles.yaml
roles:
  analyst:
    description: Can read and evaluate but not modify
    permissions:
      - read
      - eval
```

### Add a User

```yaml
# users.yaml
- username: charlie
  role: analyst
  email: charlie@example.com
```

## How RBAC is Checked

In `execute()`:
- If `user` is provided → looks up user in `users.yaml` → checks `eval` permission on their role
- If `role` is provided (no user) → checks `eval` permission directly on that role
- If neither → anonymous mode (allowed, for dev/testing)

## CLI Check

```bash
node promptos/rbac/check.js alice eval    # → ALLOWED
node promptos/rbac/check.js viewer eval   # → FORBIDDEN
```
