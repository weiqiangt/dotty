import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import * as d3 from 'd3';
import * as $ from 'jquery';
import {NodeType} from "../configs";

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit {

  @Output() selected = new EventEmitter();
  @Output() drill = new EventEmitter();

  svg: any;
  linkTextElements: any;
  linkElements: any;
  nodeElements: any;

  selectedNode: NodeType;

  constructor() {
  }

  flush() {
    if (this.svg != null) this.svg.remove();
    this.selectedNode = null;
    this.linkElements = null;
    this.nodeElements = null;
  }


  draw(topo: NodeType) {
    let wrapper = $('#playground-wrapper');
    let sibling = $('#info-panel');
    let WIDTH = wrapper.width();
    let HEIGHT = Math.max(sibling.height(), 500);
    let RADIUS = 40;
    let self = this;

    self.svg = d3.select('#playground')
      .attr('transform-origin', '75 240')
      .attr('width', `${WIDTH}`)
      .attr('height', `${HEIGHT}`).append('g');

    let simulation =
      d3.forceSimulation(topo.children.nodes)
        .force('linkElements', d3.forceLink().id((d: any) => d.id).distance(5 * RADIUS))
        .force("collide", d3.forceCollide(RADIUS * 2).iterations(16))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(WIDTH / 2, HEIGHT / 2))
        .force('x', d3.forceX(WIDTH / 2).strength(0.0015))
        .force('y', d3.forceY(HEIGHT / 2).strength(0.0015));


    let linkWrappers = this.svg.append('g')
      .attr('class', 'links')
      .selectAll('g')
      .data(topo.children.links)
      .enter()
      .append('g');


    this.linkElements = linkWrappers
      .append('line')
      .classed('playground-line', true)
      .on('click', (d) => {
        self.selected.emit(d);
      });

    this.linkTextElements = linkWrappers
      .append('text')
      .classed('playground-link-text', true)
      .attr('x', d => d.source.x)
      .attr('y', d => d.source.y)
      .text(d => d.label)
      .on('click', (d) => {
        self.selected.emit(d);
      });


    this.nodeElements =
      this.svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g').data(topo.children.nodes)
        .enter().append('g')
        .attr('transform', `translate(${WIDTH / 2}, ${HEIGHT / 2})`);

    this.nodeElements.append('circle')
      .classed('can-forward', (d) => d.children && d.children.length !== 0)
      .classed('leaf', (d) => !d.children || d.children.length === 0)
      .attr('r', RADIUS)
      .attr('fill', d => d3.color(d.group))
      .on('click', (d) => {
        self.selectedNode = d;
        self.selected.emit(d);
      })
      .on('dblclick', (d) => {
        if (d.children != null) {
          self.selectedNode = d;
          self.drill.emit(d);
        }
      })
      .call(d3.drag().on('start', (d: any) => {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }).on('drag', (d: any) => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }).on('end', (d: any) => {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      })).append('title').text(d => d.label);

    this.nodeElements
      .append('text')
      .text(d => d.label)
      .style('font-size', (d) => `${(RADIUS - 8) / d.label.length * 3.5}px`)
      .attr('dy', '.35em');


    simulation
      .nodes(topo.children.nodes)
      .on('tick', () => this.ticked());

    (<d3.ForceLink<any, any>>(simulation.force('linkElements'))).links(topo.children.links);
  }


  ticked() {
    this.linkElements
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    this.linkTextElements
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2);

    this.nodeElements.attr('transform', d => `translate(${d.x}, ${d.y})`);
  }

  setTopo(topo: NodeType) {
    this.flush();
    this.draw(topo);
  }

  ngOnInit() {

  }
}
