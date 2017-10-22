import * as React from 'react'

interface ReactFiniteProps<T> {
  style?: object
  className?: string

  useWindowForVisibilityDetection?: boolean
  initialNumberOfDisplayedChildren?: number
  safetyMarginInPixels?: number
  childrenBlockSize?: number
  debug?: boolean

  // Alternative way to render child elements (avoids creating unneded elements)
  ElementComponent?: React.ComponentClass<T>
  elements?: T[]

  estimatedElementHeightInPixels?: number
}

const defaultInitialNumberOfDisplayedChildren = 50
const defaultSafetyMarginInPixels = 600
const defaultChildrenBlockSize = 19

interface ReactFiniteState {
  childrenBlocksStartIndex: number
  childrenBlocksEndIndex: number
}

export class ReactFinite<T> extends React.PureComponent<ReactFiniteProps<T>, ReactFiniteState> {
  constructor(props: ReactFiniteProps<T>) {
    super(props)
    this.state = {
      childrenBlocksStartIndex: 0,
      childrenBlocksEndIndex: Math.max(Math.ceil(
        (props.initialNumberOfDisplayedChildren || defaultInitialNumberOfDisplayedChildren) / 
        (props.childrenBlockSize || defaultChildrenBlockSize)
      ), 1)
    }
  }

  private frontObserver: IntersectionObserver
  private backObserver: IntersectionObserver

  componentDidMount() {
    if(this.frontBumper === null) throw new Error("Front Bumper is not rendered")
    if(this.backBumper === null) throw new Error("Back Bumper is not rendered")
    if(this.container === null) throw new Error("Container is not rendered")


    this.frontObserver = new IntersectionObserver(this.frontBumperVisibilityChanged, {
      root: this.props.useWindowForVisibilityDetection ? undefined : this.container,
      threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0]
    })
    this.frontObserver.observe(this.frontBumper)

    this.backObserver = new IntersectionObserver(this.backBumperVisibilityChanged, {
      root: this.props.useWindowForVisibilityDetection ? undefined : this.container,
      threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0]
    })
    this.backObserver.observe(this.backBumper)
  }

  private heightsOfInvisibleFrontBlocks: number[] = []
  private heightsOfInvisibleBackBlocks: number[] = [] // TODO: Initialize to some sensible value or let the user pass it

  componentWillUpdate(_nextProps: ReactFiniteProps<T>, nextState: ReactFiniteState) {
    // TODO: Deduplicate this code
    for(let blockId = this.state.childrenBlocksStartIndex; blockId < nextState.childrenBlocksStartIndex; ++blockId) {
      const block = this.blocksByBlockId[blockId]
      if(block !== undefined && block !== null) {
        const height = block.offsetHeight
        this.heightsOfInvisibleFrontBlocks.push(height)
      }
    }
    for(let blockId = nextState.childrenBlocksStartIndex; blockId < this.state.childrenBlocksStartIndex; ++blockId) {
      const height = this.heightsOfInvisibleFrontBlocks.pop()
      if(height === undefined) {
        throw new Error("The previous block height must be known")
      }
    }
    for(let blockId = nextState.childrenBlocksEndIndex; blockId < this.state.childrenBlocksEndIndex; ++blockId) {
      const block = this.blocksByBlockId[blockId]
      if(block !== undefined && block !== null) {
        const height = block.offsetHeight
        this.heightsOfInvisibleBackBlocks.push(height)
      }
    }
    for(let blockId = this.state.childrenBlocksEndIndex; blockId < nextState.childrenBlocksEndIndex; ++blockId) {
      this.heightsOfInvisibleBackBlocks.pop()
    }
  }

  componentWillUnmount() {
    this.backObserver.disconnect()
    this.frontObserver.disconnect()
  }

  private container: HTMLDivElement | null = null
  private scrollContent: HTMLDivElement | null = null
  private blocksByBlockId: { [blockId: number]: HTMLDivElement | null } = {}

  private getChildrenBlocks() {
    const { ElementComponent, elements } = this.props

    let getChildrenSlice: (start: number, end: number) => React.ReactNode[]
    let numberOfChildren: number

    if(ElementComponent && elements) {
      getChildrenSlice = (start, end) => elements.slice(start, end).map(element => <ElementComponent {...element} />)
      numberOfChildren = elements.length
    } else {
      const allChildren = React.Children.toArray(this.props.children)
      getChildrenSlice = (start, end) => allChildren.slice(start, end)
      numberOfChildren = allChildren.length
    }
    
    const childrenBlockSize = this.props.childrenBlockSize || defaultChildrenBlockSize
    const maxBlockId = Math.floor(numberOfChildren / childrenBlockSize)
  
    const blocks = []

    const { childrenBlocksStartIndex, childrenBlocksEndIndex } = this.state
    for(let blockId = Math.max(childrenBlocksStartIndex,0); blockId < Math.min(childrenBlocksEndIndex, maxBlockId+1); ++blockId) {
      blocks.push({ blockId, children: getChildrenSlice(childrenBlockSize*blockId, childrenBlockSize*(blockId+1)) })
    }
    return blocks
  }

  render() {
    const blocks = this.getChildrenBlocks()

    return <div ref={container => this.container = container} style={this.props.style} className={this.props.className}>
      <div ref={scrollContent => this.scrollContent = scrollContent}>
        {this.renderFrontPadding()}
        <div style={{ position: "relative" }}>
          {blocks.map(block =>
            <div key={block.blockId} ref={blockElement => this.blocksByBlockId[block.blockId] = blockElement}>
              {block.children}
            </div>
          )}
          {/* Bumpers are rendered at the end to ensure they are rendered on top of the other content */}
          {this.renderBackBumper()}
          {this.renderFrontBumper()}
        </div>
        {this.renderBackPadding()}

      </div>
    </div>
  }

  private renderFrontPadding() {
    return <div>
      {this.heightsOfInvisibleFrontBlocks.map((height, id) => <div key={id} style={{ height }} />)}
    </div>
  }

  private renderBackPadding() {
    const childrenBlockSize = this.props.childrenBlockSize || defaultChildrenBlockSize
    const numberOfChildren = this.getNumberOfChildren()
    //const lastBlockPadding = childrenBlockSize - (numberOfChildren % childrenBlockSize)
    const noRemainingElements = Math.max(0, 
      numberOfChildren - this.state.childrenBlocksEndIndex * childrenBlockSize
    )

    const estimatedElementHeightInPixels = 
      (this.heightsOfInvisibleBackBlocks.length > 0 || this.heightsOfInvisibleFrontBlocks.length > 0)
        ? (this.heightsOfInvisibleBackBlocks.reduce((a,b) => a+b, 0) + this.heightsOfInvisibleFrontBlocks.reduce((a,b) => a+b, 0))
          / (this.heightsOfInvisibleBackBlocks.length + this.heightsOfInvisibleFrontBlocks.length)
          / childrenBlockSize
        : (this.props.estimatedElementHeightInPixels || 0)

    return <div>
      {this.heightsOfInvisibleBackBlocks.map((height, id) => <div key={id} style={{ height }} />)}

      { /* Add one div of large height to accomodate for all the remaining elements */ }
      <div style={{ height: noRemainingElements * estimatedElementHeightInPixels }} />
    </div>
  }

  // TODO: this number doesn't need to be computed multiple times during one rendering
  private getNumberOfChildren() {
    const { ElementComponent, elements } = this.props
    if(ElementComponent && elements) {
      return elements.length
    } else {
      return React.Children.count(this.props.children)
    }
  }

  private frontBumper: HTMLDivElement | null = null
  private backBumper: HTMLDivElement | null = null

  private getBumperStyle = () => {
    const safetyMarginInPixels = this.props.safetyMarginInPixels || defaultSafetyMarginInPixels
    return {
      height: safetyMarginInPixels,
      width: "100%",
      position: "absolute" as "absolute",
      // It's important bumpers don't have z-index - I believe this is what messes the scrollTop behaviour
      backgroundColor: this.props.debug ? "hsla(270, 50%, 40%, 0.3)" : undefined,
    }
  }

  private renderFrontBumper() {
    const style = {
      top: "0px",
      ...this.getBumperStyle(),
    }
    return <div ref={frontBumper => this.frontBumper = frontBumper} style={style} />
  }

  private renderBackBumper() {
    const style = {
      bottom: "0px",
      ...this.getBumperStyle(),
    }
    return <div ref={backBumper => this.backBumper = backBumper} style={style} />
  }

  private isFrontBumperVisible: boolean = true
  private isBackBumperVisible: boolean = true

  private frontBumperVisibilityChanged: IntersectionObserverCallback = (entries) => {
    for(const entry of entries) {
      if(entry.intersectionRatio >= 0 && (entry as any).isIntersecting === true) {
        this.isFrontBumperVisible = true
      } else if (entry.intersectionRatio === 0 && (entry as any).isIntersecting === false) {
        this.isFrontBumperVisible = false
      }
      if(entry.intersectionRatio >= 0.4 && (entry as any).isIntersecting === true) {
        this.scheduleEndpointExpansion(Endpoint.Front)
      }
    }
  }

  private backBumperVisibilityChanged: IntersectionObserverCallback = (entries) => {
    for(const entry of entries) {
      if(entry.intersectionRatio >= 0 && (entry as any).isIntersecting === true) {
        this.isBackBumperVisible = true
      } else if (entry.intersectionRatio === 0 && (entry as any).isIntersecting === false) {
        this.isBackBumperVisible = false
      }
      if(entry.intersectionRatio >= 0.4 && (entry as any).isIntersecting === true) {
        this.scheduleEndpointExpansion(Endpoint.Back)
      }
    }
  }

  private scheduleEndpointExpansion(endpoint: Endpoint) {
    if(endpoint === Endpoint.Front) {
      this.setState((state: ReactFiniteState) => state.childrenBlocksStartIndex !== 0 ? { 
        "childrenBlocksStartIndex": state.childrenBlocksStartIndex - 1,
        "childrenBlocksEndIndex": this.isBackBumperVisible ? state.childrenBlocksEndIndex : state.childrenBlocksEndIndex - 1,
      } : null)
    } else {
      this.setState((state: ReactFiniteState) => ({ 
        "childrenBlocksEndIndex": state.childrenBlocksEndIndex + 1,
        "childrenBlocksStartIndex": this.isFrontBumperVisible ? state.childrenBlocksStartIndex : state.childrenBlocksStartIndex + 1,
      }))
    }
  }
}

enum Endpoint {
  Front, Back
}

export default ReactFinite