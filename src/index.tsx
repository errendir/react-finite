import * as React from 'react'

interface ReactFiniteProps {
  style?: object
  className?: string

  useWindowForVisibilityDetection?: boolean
  initialNumberOfDisplayedChildren?: number
  safetyMarginInPixels?: number
  childrenBlockSize?: number
  debug?: boolean
}

const defaultInitialNumberOfDisplayedChildren = 5
const defaultSafetyMarginInPixels = 600
const defaultChildrenBlockSize = 19

interface ReactFiniteState {
  childrenBlocksStartIndex: number
  childrenBlocksEndIndex: number
}

export class ReactFinite extends React.Component<ReactFiniteProps, ReactFiniteState> {
  constructor(props: ReactFiniteProps) {
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

  componentWillUpdate(nextProps: ReactFiniteProps, nextState: ReactFiniteState) {
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
      const height = this.heightsOfInvisibleBackBlocks.pop()
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
    const allChildren = React.Children.toArray(this.props.children)
    
    const childrenBlockSize = this.props.childrenBlockSize || defaultChildrenBlockSize
    const blocks = []

    const { childrenBlocksStartIndex, childrenBlocksEndIndex } = this.state
    const maxBlockId = Math.floor(allChildren.length / childrenBlockSize)
    for(let blockId = Math.max(childrenBlocksStartIndex,0); blockId < Math.min(childrenBlocksEndIndex, maxBlockId+1); ++blockId) {
      blocks.push({ blockId, children: allChildren.slice(childrenBlockSize*blockId, childrenBlockSize*(blockId+1)) })
    }
    return blocks
  }

  render() {
    const blocks = this.getChildrenBlocks()
    const scrollContentStyle = {
      display: "grid", gridTemplateColumns: "1fr", gridTemplateRows: "auto 1fr auto"
    }

    return <div ref={container => this.container = container} style={this.props.style} className={this.props.className}>
      <div ref={scrollContent => this.scrollContent = scrollContent} style={scrollContentStyle}>
        {this.renderFrontPadding()}
        <div style={{ gridRow: "2/3", gridColumn: "1/2" }}>
          {blocks.map(block =>
            <div key={block.blockId} ref={blockElement => this.blocksByBlockId[block.blockId] = blockElement}>
              {block.children}
            </div>
          )}
        </div>
        {this.renderBackPadding()}

        {/* Bumpers are rendered at the end to ensure they are rendered on top of the other content */}
        {this.renderBackBumper()}
        {this.renderFrontBumper()}
      </div>
    </div>
  }

  private renderFrontPadding() {
    return <div style={{ gridRow: "1/2", gridColumn: "1/2" }}>
      {this.heightsOfInvisibleFrontBlocks.map((height, id) => <div key={id} style={{ height: height }} />)}
    </div>
  }

  private renderBackPadding() {
    return <div style={{ gridRow: "3/4", gridColumn: "1/2" }}>
      {this.heightsOfInvisibleBackBlocks.map((height, id) => <div key={id} style={{ height: height }} />)}
    </div>
  }

  private frontBumper: HTMLDivElement | null = null
  private backBumper: HTMLDivElement | null = null

  private getBumperStyle = () => {
    const safetyMarginInPixels = this.props.safetyMarginInPixels || defaultSafetyMarginInPixels
    return {
      height: safetyMarginInPixels,
      width: "100%",
      gridRow: "2/3", gridColumn: "1/2",
      // It's important bumpers don't have z-index - I believe this is what messes the scrollTop behaviour
      backgroundColor: this.props.debug ? "hsla(270, 50%, 40%, 0.3)" : undefined,
    }
  }

  private renderFrontBumper() {
    const style = {
      alignSelf: "start" as any,
      ...this.getBumperStyle(),
    }
    return <div ref={frontBumper => this.frontBumper = frontBumper} style={style} />
  }

  private renderBackBumper() {
    const style = {
      alignSelf: "end" as any,
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

  private expandingEndpoint: Endpoint | null = null

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