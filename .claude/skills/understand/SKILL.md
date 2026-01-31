---
name: understand
description: Multi-specialist collaborative analysis to understand how features, functions, or components work
allowed-tools: Bash, Grep, Read, Glob, LS, Task
argument-hint: "[feature/function/component to analyze]"
---

# Multi-Agent Understanding Analysis

Execute multi-specialist analysis using independent subagents to comprehensively understand codebase features.

**Usage**: `/understand-agent [the thing to understand]`

**Arguments**: Feature, function, component, or system to analyze (e.g., "authentication system", "User model", "PDF generation")

## Implementation

Execute using Task tool to create independent subagents:

### Phase 1: Specialist Assignment & Analysis

Analyze target scope and launch 4-7 parallel subagents:

**Example Implementation**:
```
Task 1: "Code Structure Analyst"
- Prompt: "Analyze [target] structure by finding definitions, tracing implementation paths, identifying file locations, dependencies, and imports. Use Grep/Glob extensively to map the codebase."

Task 2: "Data Flow Analyst"  
- Prompt: "Examine [target] data flow, input/output patterns, state management, transformations, and side effects. Trace data from entry to exit points."

Task 3: "Usage Pattern Analyst"
- Prompt: "Find where [target] is used/called, identify integration points, common usage patterns, configuration options, and calling contexts throughout codebase."

Task 4: "UX/UI Analyst"
- Prompt: "Analyze [target] user interface and experience aspects including React components, Phoenix LiveView, Astro components, HTML templates, styling, user interactions, and accessibility patterns."

Task 5: "Database Analyst"
- Prompt: "Investigate [target] database interactions, schema relationships, queries, constraints, indexes. Use Tidewave MCP for Ecto analysis and PostgreSQL CLI for direct schema examination."

Task 6: "API Analyst"  
- Prompt: "Examine [target] API interactions, endpoints, request/response patterns, GraphQL queries/mutations, REST calls, and external service integrations."

Task 7: "Test Coverage Analyst"
- Prompt: "Locate tests for [target], analyze test coverage, key test scenarios, edge cases, and testing strategies. Map test files to implementation."

Task 8: "Codex Fresh Eyes Understanding" (PARALLEL)
- MCP: codex
- Prompt: "Analyze [target] from scratch with fresh eyes. What is this component/feature actually doing at a high level? How would you explain its purpose and implementation approach to someone unfamiliar with this codebase? What design decisions and architectural choices do you recognize? Focus on the 'what' and 'how' without getting into evaluation."
```

**Selection Criteria** (agents are optional based on relevance):
- **Function/Method**: Code Structure + Data Flow + Usage Pattern + Test Coverage
- **UI Component**: Code Structure + UX/UI + Usage Pattern + Data Flow + Test Coverage  
- **API/Service**: Code Structure + API + Data Flow + Usage Pattern + Test Coverage
- **Database Logic**: Database + Code Structure + Data Flow + Test Coverage
- **Feature/System**: All applicable specialists for comprehensive analysis (skip irrelevant ones)

### Phase 2: Cross-Pollination & Integration

Launch second round connecting specialist findings, identifying interaction patterns, validating conclusions across domains.

### Phase 2.5: Codex Knowledge Synthesis

Task: "Codex Integration Analyst"
- MCP: codex
- Input: All specialist findings
- Prompt: "Review these specialist analyses of [target]. Based on your knowledge of similar implementations across different frameworks and languages, what key insights about how this works are missing? What integration patterns or architectural relationships weren't fully explored? How do the pieces actually fit together in the broader system?"

### Phase 3: Synthesis & Documentation

Collect outputs, synthesize comprehensive understanding, organize findings into structured documentation format.

## Analysis Standards

Each specialist should examine:
- **Code Structure**: Definitions, file locations, dependencies, imports, related modules
- **Data Flow**: Input/output, transformations, state management, error handling  
- **Usage Patterns**: Where used, how called, integration points, configuration
- **UX/UI**: React/Phoenix LiveView/Astro components, styling, interactions, accessibility
- **Database**: Schema, queries, constraints, indexes (Tidewave + psql)
- **API**: Endpoints, requests/responses, GraphQL operations, service integrations
- **Testing**: Test files, coverage, scenarios, edge cases

## Output Protocol

```
=== MULTI-AGENT UNDERSTANDING: [Target] ===
Scope: [Function/Component/Feature/System] | Specialists: [Dynamic assignment]

--- ROUND 1 ---
🔍 SPECIALIST ANALYSIS
[Each specialist's domain findings and discoveries]

🧠 CODEX FRESH EYES
[Independent Codex perspective on component purpose and implementation approach]

🎯 CROSS-VALIDATION
[Specialists engage with and validate each other's findings]

🔄 CODEX INTEGRATION SYNTHESIS
[Codex analysis of how specialist findings connect to broader architectural patterns]

⚖️ INTEGRATION ASSESSMENT
[Overall system coherence and interaction analysis]

--- COMPREHENSIVE UNDERSTANDING ---

### Overview
[Purpose, functionality, and role in system]

### Location & Structure  
- Main files: [paths:line numbers from Code Structure Analyst]
- Related files: [connected modules and dependencies]

### How It Works
[Step-by-step flow from Data Flow Analyst]
1. [Entry points and initialization]
2. [Key logic and processing steps] 
3. [Output and side effects]

### Dependencies
- Internal: [project dependencies from Code Structure]
- External: [libraries, APIs, services]

### Usage Examples  
[Common patterns from Usage Pattern Analyst]
- [Where called/used with examples]
- [Configuration options and contexts]

### UI/UX Integration (if UI-related)
[From UX/UI Analyst when applicable]
- Components: [React/LiveView/Astro structure]
- Interactions: [user flows and state changes]  
- Styling: [CSS/styling approaches]

### Database Integration (if data-related)
[From Database Analyst when applicable]
- Tables/schemas: [Tidewave + psql analysis]
- Queries: [key database operations]
- Constraints: [indexes and relationships]

### API Integration (if service-related)
[From API Analyst when applicable]  
- Endpoints: [REST/GraphQL operations]
- Data flow: [request/response patterns]
- Services: [external integrations]

### Testing
[From Test Coverage Analyst]
- Test files: [paths and coverage]
- Key scenarios: [test cases and edge cases]

### Notes & Considerations
- Performance: [implications and bottlenecks]
- Security: [considerations and risks]
- Limitations: [known constraints]
- Improvements: [optimization opportunities]
```

## Search Strategy

**Specialists use systematic approach**:
- Grep for definitions and usages across codebase
- Glob to locate related files by patterns
- Read key implementation files for detailed analysis
- Tidewave MCP for Elixir/Ecto schema introspection and code interactions
- PostgreSQL CLI for direct database structure examination

## Success Metrics
- Complete tracing from entry to exit points with file:line references
- Cross-specialist validation ensures no gaps in understanding
- Findings enable effective modification or extension of the analyzed component
- Documentation provides sufficient context for development decisions
- Integration points and dependencies clearly mapped

Execute multi-agent understanding analysis starting with scope identification and dynamic specialist assignment.

$ARGUMENTS

Begin comprehensive analysis now, identifying scope and launching appropriate specialists.