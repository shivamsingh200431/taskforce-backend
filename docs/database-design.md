# TaskForce Database Design

## Overview

TaskForce is designed around one core principle:

> Preserve historical data instead of overwriting it.

Every completed, missed, rejected, approved, or reassigned chore should remain available for analytics, leaderboards, reports, audit logs, and historical tracking.

---

# Core Principles

## 1. Calendar Driven

Recurring chores are generated automatically according to the calendar.

The system should not wait for a user to open the application before creating recurring chores.

Benefits:

* Faster dashboard loading
* Reliable notifications
* Accurate history
* Missed chore tracking
* Calendar view

---

## 2. Templates Never Change

Recurring chores are stored as templates.

Example:

Wash Dishes

Every Day

Difficulty 3

Rotation Enabled

The template represents the rule.

It does not represent an actual occurrence.

---

## 3. Every Occurrence Is Stored

Each occurrence becomes its own Chore Instance.

Example:

Monday

Wash Dishes

Assigned to Aman

Completed

Tuesday

Wash Dishes

Assigned to Shivam

Missed

This preserves complete history.

---

## 4. History Is Never Lost

Historical information is required for:

* Leaderboards
* Statistics
* Proof history
* Audit logs
* Monthly reports
* Calendar view

No recurring chore should overwrite previous completions.

---

# Models

## User

Stores user authentication information.

---

## Household

Represents a household.

One household contains multiple members.

---

## Membership

Connects Users and Households.

Stores:

* Role
* Joined Date

Future:

* Rotation Position
* Household-specific Preferences

---

## Availability

Represents temporary member unavailability.

Fields:

* Household
* User
* Start Date
* End Date
* Optional Reason

Purpose:

Allows the rotation engine to ignore unavailable members while preserving historical availability records.

---

## Chore Template

Represents a recurring rule.

Example:

Wash Dishes

Every Day

Rotate Weekly

Difficulty 3

The template is never completed.

It only defines future chore generation.

---

## Chore Instance

Represents one occurrence of a chore.

Example:

Date

Assigned Members

Completion Status

Proof

Feedback

Reports

This is the heart of the system.

Leaderboards, reports and analytics will all use Chore Instances.

---

## Report

Represents a report submitted by a household member.

Reports are anonymous to members.

Reporter identity is hidden by default from admins.

Reporter identity may only be revealed through an audited action.

---

## Audit Log

Stores sensitive administrative actions.

Examples:

* Revealed reporter identity
* Changed difficulty
* Reassigned chores
* Manual workload override
* Deleted future records

Audit logs provide accountability.

---

# Services

## Calendar Engine

Responsible for:

* Detecting new day/week/month
* Creating recurring chore instances
* Preventing duplicate generation

---

## Rotation Engine

Responsible for:

Selecting the next member for recurring chores.

It only answers:

Who should receive the next occurrence?

---

## Workload Balancer

Responsible for:

Redistributing chores when members become unavailable.

Supports:

* Automatic balancing
* Admin overrides

---

## Notification Service

Future feature.

Will notify members about:

* New chores
* Upcoming chores
* Missed chores
* Reports
* Approvals

---

# Chore Workflows

## One-Time Admin Assigned

Admin Creates

↓

Assigned

↓

Member Completes

↓

Admin Reviews

↓

Completed

or

Needs Improvement

---

## Recurring Chore

Calendar Creates Instance

↓

Assigned

↓

Member Marks Complete

↓

Completed

↓

Admin may manually revert completion if required.

---

## Member Submitted Chore

Member Creates

↓

Pending Review

↓

Approved

or

Rejected

Rejected chores remain visible and can be revised and resubmitted.

---

# Reporting Principles

Reports are anonymous to members.

Reporter identity is stored securely.

Admins must provide a reason before revealing reporter identity.

Identity reveal actions are permanently logged.

---

# Design Philosophy

TaskForce prioritizes:

* Fairness
* Transparency
* Historical accuracy
* Accountability
* Automation where appropriate
* Human oversight for important decisions
