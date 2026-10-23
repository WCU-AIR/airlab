---
title: Research
nav:
  order: 3
  tooltip: Projects and publications
---

# Research

Our faculty and students work on artificial intelligence, robotics, and computing education. Related papers are listed with each project.

{% include search-info.html %}

{% include section.html %}

## On-going Projects

<div class="project-cards">
{% include list.html component="card" data="projects" filter="group == 'on-going'" %}
</div>

{% include section.html %}

## Past Projects

<div class="project-cards">
{% include list.html component="card" data="projects" filter="!group" %}
</div>

{% include section.html %}

## All Publications

{% include search-box.html %}

{% include list.html data="citations" component="citation" %}
