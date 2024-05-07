/*
*    index.js
*                              
╭━━╮╱╱╱╱╭╮╱╱╱╱╱╭╮╱╭╮╱╱╱╱╱╭╮            ━╮ ╭━
╰┫┣╯╱╱╱╱┃┃╱╱╱╱╭╯╰╮┃┃╱╱╱╱╱┃┃             | |
╱┃┃╭━╮╭━╯┣━━┳━┻╮╭╯┃┃╱╱╭━━┫╰━┳━━╮       ╱   ╲
╱┃┃┃╭╮┫╭╮┃┃━┫━━┫┃╱┃┃╱╭┫╭╮┃╭╮┃━━┫      ╱_____╲
╭┫┣┫┃┃┃╰╯┃┃━╋━━┃╰╮┃╰━╯┃╭╮┃╰╯┣━━┃     ╱       ╲  
╰━━┻╯╰┻━━┻━━┻━━┻━╯╰━━━┻╯╰┻━━┻━━╯    (_________)  

This science experiment provides a gentle visual introduction to 
the many, many components that constitute the Talend Data Fabric.

Recommend viewing in Visual Source Code. 
Learning Comment: most popular code editor.
Note to self: too much code, need to break it up functionally or objectify or transform to svelte components.
*/
'use strict';

/* global variables
   Learning comment: should design to not use global variables 8( but I'm a rookie */
let componentTree //tree graph of components
let titleObject  //title object
let titleData    //title text
let select       //language option selection
let description  //descriptions of the components that appear in tooltips
let data         //names of the components for the data viz
let translations //title text translated
let searchData   //search index for typeahead functionality
let iconData     //logic replaces the old way of creating icon file names on the fly did not capture edge use cases
let root

// get the data (should have just output it all to one json file, sigh.)
// 1. Component descriptions
// 2. Talend Components and lineage
// 3. Various language tranlations for pull-down menu

/* Learning comment:
 * Promise = a placeholder object for the future result of an asynchronous operation.
 * or
 * Promise = a container for an asynchronously delivered value.
 * or
 * Promise = a container for a future value. (like a response from an AJAX call)
 * or
 * How to escape callback hell (ES6)
 */
    /* Talend branded color palette:
    coral: #ff6d70; indigo gray: #323e48; pale cyan: #91d1ed;  russian violet: #2C1F56; deep blue: #19426c; qlikgreen: #009845;
    */
    let svg
    const colors = ["#ff6d70", "#323e48", "#91d1ed", "#2c1f56", "#19426c","#009845"];
    const ncolors = 6
// Learning comment:
// https://www.sarasoueidan.com/blog/svg-coordinate-systems/
// http://dh.obdurodon.org/coordinate-tutorial.xhtml

    const width = 1600 // const height = 22000 // data driven now.

    const chaos = d3.select('img').attr("transform", "translate(110,150)")

    // Define the div for the tooltip
    // needs to be changed as this grabs all divs
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style('opacity', 0);

    // const stratify = d3.stratify()
    //  .parentId(d => { return d.id.substring(0, d.id.lastIndexOf(".")) });

    // get the data (should have just output it all to one json file, sigh. done.)

    const promises = [
      d3.json('data/Componentsv801.json'),
      d3.json('data/translations.json')
    ]

    Promise.all(promises).then(allData => {

      //description  = allData[0] //descriptions of the components that appear in tooltips
      data         = allData[0] //names of the components
      // nice try but its JSON dude: description = data.slice(0).map(i => i.slice(2))
      titleData    = allData[1] //translations to various languages
      //iconData     = allData[3] //names of component icon images
    // always check your data with console.log(data) otherwise things go screwy quickly.
      
      titleObject = new TitleObject('#title-area') // title object
      searchData = getLeafComponentNames(data)  // basically all of the names of the components
      const componentArray = Object.keys(searchData)
      console.log(' Number of components: ', componentArray.length)
      autocomplete(document.getElementById("searchInput"), searchData) // setup autocompletion

      // Compute the layout.
      // root = stratify(data)
      root = d3.hierarchy(data)
        // .sort(function (a, b) { return (a.height - b.height) || a.id.localeCompare(b.id); });
      // console.log(root.descendants().slice(2))

      // This code is from: https://observablehq.com/@d3/tree   
      const padding = 1
      const dx = 22 // used to be 16 - changes the spacing between the nodes
      const dy = (16 + width) / (root.height + padding);

      // Center the tree.

      const tree = d3.tree //layout algorithm
      tree().nodeSize([dx, dy])(root) // Learning comment: there is also .size([height, width]);
      let x0 = Infinity
      let x1 = -x0
      root.each(d => {
        if (d.x > x1) x1 = d.x
        if (d.x < x0) x0 = d.x
      })
      // calculate the height based upon the values in root
      const height = x1 - x0 + dx * 2
      const cluster = d3.cluster()
            .size([height, width - 16]);
      // console.log('width, height: ', width, height)
      const viewBoxPadding = 100 // the higher the number the farther away the svg moves from the viewport (negative magnification)
      function bbBox(selection) {
        const bbox = selection.node().getBBox().width
        // console.log('bbox ', bbox)
      }
      svg = d3.select("#componentTree").append('svg')
                .attr('viewBox', [-dy * padding / 2, x0 - dx, width + viewBoxPadding, height])
                .attr('width', width)
                .attr('height', height)
                .attr('id', 'mainSVG')

      const g = svg.append("g")
        .attr("transform", "translate(-40,-130)")  //move the tree around

      const link = g.selectAll(".link")
        .data(root.descendants().slice(1))
        .enter().append("path")
        .attr("class", "link")
        .attr('id', d => `link-${d.parent.id}.${getComponentName(d)}`)
        .attr("stroke", d => colors[d3.randomInt(ncolors)()])
        .attr("d", diagonal)

      const node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
        .attr('id', d => getComponentName(d))
        .attr('transform',  d => `translate(${d.y},${d.x})`)
        .attr("cursor", "pointer")
        .attr("pointer-events", "all")
        .append('a')
        .attr('href', d =>  (d.children ? "" : getHelpLink(d))) // this is a bug; adds href to internal nodes

      node.append('circle')
        .attr("r", 4)
        .attr("fill", d => colors[d3.randomInt(ncolors)()])

      node.append('image')
        .attr('href', d => d.children ? '' :  getIconReference(d))
        .attr('x', '8px') 
        .attr("y", '-8px')
        .attr('width',  '20px') // used to be 16px
        .attr('height', '20px')

      node.append("text")
        .attr('dy', '0.32em') //was 3
        .attr('x', d => d.children ? -8 : 30)
        // .attr('id', d => getComponentName(d))
        .style("text-anchor", d => d.children ? "end" : "start")
        .text(d => getComponentName(d).replace(/_/g,' '))
        // cool tooltips appear describing the component
        .on("mouseover", (event, d) => {
          // const componentName = getComponentName(d)
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          //tooltip.html(urlExists(componentName, description[componentName]))
          tooltip.html(getTip(d))
            .style("left", (event.pageX + 10) + "px")   // d3.event went away at version 6
            .style("top", (event.pageY - 28) + "px")
        })
        .on("mouseout", d => {
          tooltip.transition()
            .duration(2000)
            .style("opacity", 0);
        })
        .append('a') // add a link to go to the help page
          .attr('href', d => getHelpLink(d))

  
      // Utility functions
      function getHelpLink(d) { // returns web link to help page
       const componentName = getComponentName(d)
        // return `https://help.talend.com/access/sources/content/topic?pageid=${componentName.toLowerCase()}&EnrichVersion=8.0&afs:lang=en`
        return `https://help.talend.com/en-US/components/8.0/${componentName.toLowerCase()}`
        // return d.data.data.href
      }

      function getIconReference(d) { //returns reference to the icon file
       // const componentName = getComponentName(d)
        // return `images/${iconData[componentName]}`
        return d.data.data.image
      }

      function getComponentName(d) { // descends down the string and returns last item after last '.'
        // return d.id.substring(d.id.lastIndexOf(".") + 1)
        return d.data.data.id 
      }
      function getDescription(d) {
        return d.data.data.description
      }
      function getTip(d) {
        let htmlCode
        const url = getIconReference(d)
        console.log(url)
        const componentName = getComponentName(d)
        const desc = getDescription(d)
        htmlCode = `<img width='64px' height='64px' style='padding: 10px' src='${url}' />`           
        htmlCode = `${htmlCode}<span><b>${componentName}</b></a>: ${desc}</span>`
        console.log(htmlCode)
        return htmlCode
      }
      let depth = 0
      function getLeafComponentNames(data, depth = 0) {
        if (!data.children) return [data.data.id]
    
        const id  = []
        for (const child of data.children) {
            const n = getLeafComponentNames(child, depth + 1) // DFS recursive, depth increases by 1
            id.push(...n)
        }
        return id.filter(n => n)
    }
      // Utility function to check to see if the icon image exists, if not then default to HAL9000 icon and message.
      // So I just converted to XMLHttpRequest and learned that is it deprecated and I should
      // use 'fetch' instead.
      function urlExists(componentName, description) {
        const client = new XMLHttpRequest()
        // const url = `img/${iconData[componentName]}` //assume naming convention
        const url = getIconReference

        let htmlCode
        client.open('HEAD', url, false)
        client.send()
        if (client.status === 200) { // it exists
          htmlCode = `<img width='96px' style='padding: 10px' src='${url}' />`           
          htmlCode = `${htmlCode}<span><b>${componentName}</b></a>: ${description}</span>`
        } else {
          htmlCode = "<img width='64px' style='padding: 10px' src='meta/hal9000.svg'/><span>I'm sorry Dave, I'm afraid I can't do that.</span>"
        }
        return (htmlCode)
      } // end of urlExists function

    }).catch(error => {
      console.log(error)
    })
    
// get menu selection for languages
    select = d3.select('#translation-selector')
                .on('change', () => titleObject.updateVis() )

// this function moves to the component and centers it on the page.
    function goToComponent(theComponent) {
        if(theComponent) {
          const element = document.getElementById(theComponent)
          element.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center"
                })
              }
    }
    // I believe this creates a curved (diagonal) path from parent to the child nodes 
    function diagonal(d) {
      return "M" + d.y + "," + d.x
        + "C" + (d.parent.y + 100) + "," + d.x
        + " " + (d.parent.y + 100) + "," + d.parent.x
        + " " + d.parent.y + "," + d.parent.x
    }
    const rectW = 60
    const rectH = 30

    const xOpacity = 50
    const yOpacity = 500
    const xTitleOpacity = 0
    const yTitleOpacity = 150
    const moreOpacity = d3.scaleLinear()
      .domain([xOpacity, yOpacity])   //screen coordinates
      .range([0, 1])        //increase opacity values
      .clamp(true)          //always in range
    const lessOpacity = d3.scaleLinear()
      .domain([xOpacity, yOpacity])    //screen coordinates
      .range([1,0])         //decrease opacity values
      .clamp(true)          //always in range
// we want the title to disappear faster

    const moreTitleOpacity = d3.scaleLinear()
      .domain([xTitleOpacity, yTitleOpacity])   //screen coordinates
      .range([0, 1])        //increase opacity values
      .clamp(true)          //always in range
    const lessTitleOpacity = d3.scaleLinear()
      .domain([xTitleOpacity, yTitleOpacity])    //screen coordinates
      .range([1,0])         //decrease opacity values
      .clamp(true)          //always in range


    const checkpoint = 300  // point 
    let scrollToViewFlag = false

  /* Learning comment and a Best practice: don't attach handlers to the window scroll event => performance hit
     and always just cache the selector queries
     that you are re-using (just ask Twitter 8) */
     // ToDo - use D3, ToDo2 - use Svelte
  // cache query results
    const scrollWrapper = document.querySelector(".scroll-wrapper")
    const titleWrapper  = document.querySelector(".title-wrapper")    
    const imgWrapper    = document.querySelector(".chaos")
    const searchWrapper = document.querySelector(".search-wrapper")
    const treeWrapper   = document.querySelector(".componentTree")
    treeWrapper.style.opacity = 0

//  Change transparency as we scroll    
    let container = d3.select(window)

    container
      .on("scroll.scroller", () => {
         const moreO = moreOpacity(window.scrollY)
         const lessO = lessOpacity(window.scrollY)
         const moreTitleO = moreTitleOpacity(window.scrollY)
         const lessTitleO = lessTitleOpacity(window.scrollY)
        
         if(window.scrollY <= checkpoint) {
          scrollWrapper.style.opacity = lessTitleO
          titleWrapper.style.opacity = lessTitleO
          imgWrapper.style.opacity = lessTitleO
          searchWrapper.style.opacity = moreO
          treeWrapper.style.opacity = moreO
          scrollToViewFlag = false
        } else {
          scrollWrapper.style.opacity = lessTitleO
          titleWrapper.style.opacity = lessTitleO
          imgWrapper.style.opacity = lessTitleO
          searchWrapper.style.opacity = moreO
          treeWrapper.style.opacity = moreO
        }
        if(scrollToViewFlag == false && window.scrollY > checkpoint+100) {
          scrollToViewFlag = true
          window.scrollTo(0, 14600) // too fast; need a transition
        }
      })
    const magnifyToggle    = document.getElementById('magnifyToggle')
    const slidecontainer   = document.getElementById('slidecontainer')

    magnifyToggle.addEventListener('change' , (event) => {
      const svg = d3.select("#mainSVG")
      const g = d3.select('g')
      // zoom section Should use closures for this...
      const handleZoom = (e) => g.attr('transform', e.transform);
      const zoom = d3.zoom().on('zoom', handleZoom);
      if(event.currentTarget.checked) {
        slidecontainer.classList.add("green-text")
        slidecontainer.classList.remove("default-text")
        svg.call(zoom)
      } else {
        slidecontainer.classList.add("default-text")
        slidecontainer.classList.remove("green-text")
        g.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        window.scrollTo(0, 9750) // too fast; need a transition
        svg.on('.zoom', null)
      }
    }) 


