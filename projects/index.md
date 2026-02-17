---
title: Projects
nav:
  order: 3
  tooltip: Software, datasets, and more
---

# {% include icon.html icon="fa-solid fa-wrench" %}Projects

Our group develops *open-source tools* and *evaluation frameworks* to support transparent and reproducible AI research. Each project contributes to our broader goal of understanding and extending the practical capabilities of intelligent systems.

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
