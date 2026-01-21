# Reality

## Architecture
**Status**: Pre-implementation - no source code exists yet.

**Project Type**: Laravel package (composer library)
**Purpose**: Version notification system for Laravel applications (inferred from project name)
**Expected Structure**: `src/` directory with ServiceProvider, Facades, and core classes

## Modules
| Module | Purpose | Entry Point |
|--------|---------|-------------|
| (none) | Project awaiting initial implementation | - |

## Entry Points
No entry points implemented yet. Expected:
- ServiceProvider for Laravel integration
- Facade for public API
- Artisan commands for CLI operations

## Patterns
- **Task Management**: Fuel for multi-session work orchestration
- **File Organization**: Standard Laravel package structure expected
- **Quality Gates**: Pre-commit hooks enforced (no `--no-verify`)

## Quality Gates
| Tool | Command | Purpose |
|------|---------|---------|
| Pre-commit hooks | `git commit` | Quality enforcement on commit |
| Pest (expected) | `vendor/bin/pest` | Testing framework |
| PHPStan (expected) | `vendor/bin/phpstan` | Static analysis |
| Pint (expected) | `vendor/bin/pint` | Code formatting |

_Note: Actual quality tools will be defined in composer.json when implemented._

## Recent Changes
_Last updated: 2026-01-21 - Initial documentation, project awaiting implementation_
