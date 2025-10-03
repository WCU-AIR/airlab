---
title: Resource Efficiency and AI 
image: images/photo.jpg
author: brian-kominick
tags: ai, energy, resources
---

<!-- excerpt start -->
"0.38–0.60 billion cubic meters of that water will be evaporated or consumed. To contextualize this measurement for a WCU student, the lower end of that range is greater than total amount of drinking water distributed in Philadelphia for a year."
<!-- excerpt end -->

## Introduction
If you follow discourse around artificial intelligence and LLMs (large language models), chances are, you've heard claims about their enormous resource demands (If you haven't, see below!). Let's take a close look at some of those claims and how we can address worries surrounding resource consumption. Since a wide variety of factors come together to create and power LLMs, we'll limit the scope of this post to two big categories: energy and water. After some background on these inputs, we'll explore methods of reducing consumption, with a focus on current technical advancements in software before ending with some ideas for further contribution. 

### Water Usage
Often overlooked, water plays a crucial role in facilitating cloud infrastructure and thus our modern AI applications. Projections for the global water withdrawal for AI usage in 2027 range from 4.2–6.6 billion cubic meters, about half the water withdrawal of the U.K. 0.38–0.60 billion cubic meters of that water will be evaporated or consumed[^1]. To contextualize this measurement for a WCU student, the lower end of that range is greater than total amount of drinking water distributed in Philadelphia for a year[^2]. Furthermore, aggressive projections for AI water withdrawal in the U.S. alone for the year 2028 exceed the 2027 global estimates[^1][^3].

![GPT-3 Water Consumption Footprint]({{'/images/other/computing-resouces/gpt3WaterFootprint.png' | relative_url}} "GPT-3 Water Consumption Footprint")[^1]
*Estimate of GPT-3's average operational water consumption footprint. '*' denotes data centers under construction as of July 2023.*

### Energy Usage
Water and energy usage are deeply interconnected, so we'll turn to that next. To best understand the relation between the two, let's look at the electricity projections for the same years. Estimates for AI's global electricity usage in 2027 range from 85–134TWh[^1]. To provide another local comparison, the bottom of that range is 5 times more energy than all of Philadelphia county consumed in 2024[^4]. The same study used to forecast the 2028 U.S. water withdrawal figure places the country's AI electricity consumption for the year at a range of 150–300TWh[^1][^3]. To narrow the context and provide insight into a particular operation, the GPUs that trained GPT-3 used rivaled the monthly consumption of about 1,450 U.S. homes[^5]. Regardless of whether you focus on the lower or upper bound of estimations, these figures underscore the colossal scale of what goes on behind the scenes of some of today's most well known apps. Let's see what kind of advances in software efficiency might mitigate things. 

## Background
We've seen now how resource-intensive the modern AI ecosystem can be, but where does all the water and energy go? To start, we should consider the performance (operations per second) required to train and run sophisticated models. This power comes from GPUs. While they are performant, tasks typically do not utilize them to their fullest potential. Despite techniques to address this underutilization, across global data centers, average GPU use ranges from 30-50%[^5]. Another study finds an even lower rate (18%) in one production environment[^6]. From this insight, researchers deduce that a considerable amount of energy goes toward these processors sitting in an idle or stalled state[^5]. 

This underutilization draws attention to a more systemic issue: In modern processors, data must travel between a memory unit and a compute unit. Since the compute units must wait for data to arrive, a bottleneck arises based on how fast the data can be accessed (the von Neumann bottleneck)[^7]. While alternative architectures are being researched, we can also address this bottleneck in how we manage resources at the software level. One major component of this challenge is memory management. By optimizing memory usage, we can reduce stalls, increase throughput, and ultimately alleviate some energy demand.

### Memory Organization
To better understand how memory management factors into performance, let's start by taking a look at how a computer organizes data. We can divide memory into two different categories: primary (internal, volatile) and secondary (external, non-volatile). The diagram below shows the different tiers of available memory, ordered by size and access time. Registers, caches, and main memory (dynamic random-access memory) fall under the primary category. They store programs and data for the processes your computer is currently running (like this webpage!) and are directly accessible to the processor. On the other hand, things like HDDs (hard drive disks) and SSDs (solid-state drives) constitute secondary memory. They are used for long-term storage, retain data even when unpowered, and are indirectly accessible to the processor through input/output operations. As you can see in the diagram, access time for secondary storage jumps to the scale of milliseconds, whereas primary storage can be accessed in nanoseconds. Importantly, it also indicates the direction of cost per bit, a monetary measurement (primary storage is more complex to physically produce). Taking these attributes into consideration, we can see that efficient design necessitates a balance between the two categories.

![Memory Hierarchy Diagram]({{'/images/other/computing-resouces/Memory-Hierarchy-Design.png' | relative_url}} "Memory Hierarchy Diagram")[^8]

## Software-Level Optimizations
To pragmatically address the bottleneck of input/output operations, let's look at a couple specific ways we can better utilize the computing resources we have available: kernel fusion and gradient checkpointing[^5]. 

### Kernel Fusion
Since i/o operations to secondary memory are more computationally expensive, we can try to reduce them by maximizing the potential of our primary memory through kernel fusion. This technique combines multiple operations instead of executing them sequentially and reading/writing temporary values to memory after each one. 

#### User-Driven Example
To simplify this process, consider the following conceptual example:

$$(5 + 3) * 10$$

To evaluate this expression, we could do the following

```python
def add_and_multiply(a, b, c):
    temp = a + b
    return temp * c
print(add_and_multiply(5, 3, 10))
```

In this example, we create a temporary variable to represent the intermediary result. Instead of allocating this memory to add and multiply separately, we can combine them into a single operation, removing the need to allocate memory and read/write to it.

```python
def add_and_multiply(a, b, c):
    return (a + b) * c
print(add_and_multiply(5, 3, 10))
```

Comparing these two functions is a very simple way of illustrating what happens when kernels are fused in machine-learning tasks. While this example is small, the classic example for kernel fusion involves linear algebra and sequential matrix operations. Data for these operations can measure in gigabytes and utilize secondary memory.

#### Compiler-Driven Example
While a developer can manually combine operations, this strategy is largely applied at a compiler level. Instead of applying optimizations directly to source code, IRs (intermediate representations) enable the transformation of high-level languages into a lower, hardware-agnostic form, while still retaining important semantic information from the original form. MLIR (Multi-Level Intermediate Representation) is a specific form or framework which makes use of fusion and is widely used for machine learning. Like the name suggests, MLIR allows code to be represented at varying levels of abstraction, each conducive to different optimizations[^9].

Using MLIR, compilers can view code as a DAG (directed acyclic graph) which shows data dependencies within the program. With nodes in the graph representing operators, it reveals the flow of data from one operator to the next. When an operator immediately consumes the output from the one preceding it, it could be advantageous to fuse the operations rather than storing and subsequently collecting the data. Let's take a look at a simple arithmetic example. Consider the expression:

$$a + b * c + 1$$

To keep things more accessible, let's implement our own tiny IR just for this example. The signatures could look like this:

```cpp
struct Node {
    inline static int counter = 0;
    int id;
    Node() : id(counter++) {}
    virtual ~Node() = default;
};

struct VarA : Node {
    VarA();
};

struct VarB : Node {
    VarB();
};

struct VarC : Node {
    VarC();
};

struct Const : Node {
    double value;
    Const(double v);
};

struct Add : Node {
    std::shared_ptr<Node> lhs, rhs;
    Add(std::shared_ptr<Node> l, std::shared_ptr<Node> r);
};

struct Mult : Node {
    std::shared_ptr<Node> lhs, rhs;
    Mult(std::shared_ptr<Node> l, std::shared_ptr<Node> r);
};

struct FusedOp : Node {
    std::vector<std::shared_ptr<Node>> inputs;
    explicit FusedOp(std::vector<std::shared_ptr<Node>> in);
};
```

If we parse this expression into a DAG using our minimal IR, we could represent it like this:

![Before Fusion]({{'/images/other/computing-resouces/before.png' | relative_url}} "Before Fusion")

From here, we can see the relationships between each term and apply a function to recursively traverse the tree. That could transform the original graph into the following:

![After Fusion]({{'/images/other/computing-resouces/after.png' | relative_url}} "After Fusion")

 Implementing this practice in a compiler removes the need to manually apply it to all operations and allows for further optimizations at a smaller level.

The complete code for this implementation can be found [here](https://github.com/brankominick/fusion-demo). 

### Gradient Checkpointing
Since bottlenecks are often caused by memory operations and leave computational units idle, we can use the gradient checkpointing strategy to reduce the amount of memory we use in return for increasing the amount of computations being done. In other words, instead of recording all of the data you need, record only a subset (checkpoints) and use it to redo the rest of the calculations as needed. It's like the reverse of memoization. Unlike kernel fusion, this method is more limited in its use cases but very applicable to the backwards passes in machine learning and AI training. Because it's more specific to AI training, it can be found implemented at the framework level like in PyTorch[^10].

In order to do a short demonstration without abstracting away the logic, let's put together a simple implementation and take some benchmarks. To account for storage, we compare saving each intermediate value with saving only some:

```cpp
double compute_with_storage(double x, int depth) {
    std::vector<double> intermediates(depth + 1);
    intermediates[0] = x;
    for (int i = 1; i <= depth; i++) {
        intermediates[i] = intermediates[i - 1] * intermediates[i - 1] + 1.0;
    }
    std::cout << "  Storage used: "
              << std::fixed << std::setprecision(2)
              << memory_in_mb(intermediates.size())
              << " MB\n";
    return intermediates[depth];
}
```

To cut down on intermediates, instead of recording each one, we can update a variable and only record the checkpoints:
```cpp
int i = 0;
    while (i < depth) {
        double val = checkpoints.back();

        int steps = std::min(checkpoint_interval, depth - i);
        for (int j = 0; j < steps; j++) {
            val = val * val + 1.0;
        }
        checkpoints.push_back(val);
        i += steps;
    }
```

With an x value of 1.001 and a ridiculous depth of 2 billion, we get the following results:

```bash
Storage used: 15258.79 MB
Execution time with storage: 28.81s

K,Memory_MB,Time_s
10,1525.88,7.10
50,305.18,6.24
100,152.59,6.11
500,30.52,6.09
1000,15.26,6.10
5000,3.05,6.07
10000,1.53,6.05
50000,0.31,6.03
```

{% include checkpoint-plot.html %}

As we can see, adding checkpoints dramatically reduces not only the amount of memory used but also the total run time. However, the checkpoints have diminishing returns. As they become more frequent (as K decreases), the memory usage and execution time both increase. If we continue to decrease checkpoints (increase K), we would see slight increases to execution time in that direction as well.

The complete code for this implementation can be found [here](https://github.com/brankominick/gradient-checkpointing-demo).

## Conclusion
In this post, we identified the von Neumann bottleneck, a current limitation in conventional computer architecture, as well as a couple programming strategies to mitigate its impact. While each of these strategies brings its own optimizations, they also come with their own limitations, requiring careful consideration in how they're implemented. Additionally, it's important to remember that savings will compound when these techniques and others are applied in conjunction, resulting in higher utilization of compute units and thus, less wasted energy. Aside from software-level optimizations, researchers continue to bring advancements to hardware capabilities and operational procedures[^5].

## Opportunities for Future Work
As noted in the conclusion, the strategies covered in this post have their limitations. Future work could include examining these bounds such as the payoff for fusion with complex kernels or how preferring primary memory may limit high-precision values. We could also explore other software-level optimization methods. Additionally, we could go in a more concrete direction and extend current frameworks like MLIR to execute and benchmark some theoretical or unproven methods. Follow along to see what comes next!

# References and Links

[^1]: Li, Peng et al. “Making AI Less 'Thirsty'.” Communications of the ACM 68 (2023): 54 - 61.
[^2]: Philadelphia Water Department. Resource Recovery & Energy Production. Philadelphia Water Department, https://water.phila.gov/sustainability/energy/
[^3]: Shehabi, A., Smith, S.J., Horner, N., Azevedo, I., Brown, R., Koomey, J., Masanet, E., Sartor, D., Herrlin, M., Lintner, W. 2016. United States Data Center Energy Usage Report. Lawrence Berkeley National Laboratory, Berkeley, California. LBNL-1005775
[^4]: Philadelphia County, Pennsylvania Electricity Rates & Statistics.” FindEnergy, FindEnergy LLC, 31 July 2025, https://findenergy.com/pa/philadelphia-county-electricity/
[^5]: Makin, Yashasvi, and Rahul Maliakkal. “Sustainable AI Training via Hardware–Software Co-Design on NVIDIA, AMD, and Emerging GPU Architectures.” *arXiv*, preprint arXiv:2508.13163, 28 July 2025, https://arxiv.org/abs/2508.13163.
[^6]: Weng, Qizhen, et al. “MLaaS in the Wild: Workload Analysis and Scheduling in Large-Scale Heterogeneous GPU Clusters.” NSDI ’22: Proceedings of the 19th USENIX Symposium on Networked Systems Design and Implementation, 4–6 Apr. 2022, Renton, WA, USENIX Association, https://www.usenix.org/system/files/nsdi22-paper-weng.pdf
[^7]: Hess, Peter. “Why a Decades Old Architecture Decision Is Impeding the Power of AI Computing.” IBM Research Blog, 10 Feb. 2025, research.ibm.com/blog/why-von-neumann-architecture-is-impeding-the-power-of-ai-computing.
[^8]: Zintler, Alexander. (2022). Investigating the influence of microstructure and grain boundaries on electric properties in thin film oxide RRAM devices – A component specific approach. 10.26083/tuprints-00021657. 
[^9]: Chris Lattner, Mehdi Amini, Uday Bondhugula, Albert Cohen, Andy Davis, Jacques Pienaar, River Riddle, Tatiana Shpeisman, Nicolas Vasilache, and Oleksandr Zinenko. “MLIR: Scaling compiler infrastructure for domain specific computation.” In 2021 IEEE/ACM International Symposium on Code Generation and Optimization (CGO), pp. 2-14. IEEE, 2021.
[^10]: Paszke, Adam, et al. Automatic Differentiation in PyTorch. 2017, OpenReview, https://openreview.net/pdf?id=BJJsrmfCZ