---
title: Memory Optimization Demo
image: 'images/other/blogs/computing-resources/before.png'
author: brian-kominick
tags: ai, memory, resources
---

## Introduction
In my [last blog post]({{'/blog/_posts/2025-09-20-computing-resources.html' | relative_url}} "Computing Resources Blog"), we looked at some past and projected figures for AI's natural-resource consumption and showed the expenditure to be immense. Following that, we gave a high-level view of current or proposed methods to mitigate those figures. In this blog post, we'll inspect a couple current software-level optimizations (kernel fusion and gradient checkpointing) and implement some simple demos to deepen our understanding of how they work. Following that, I'll give a brief reflection on what I've gained from writing this post and what I plan to do next.

## Background
<!-- excerpt start -->To pragmatically address the bottleneck of input/output operations, let's look at a couple specific ways we can better utilize the computing resources we have available: kernel fusion and gradient checkpointing<!-- excerpt end -->[^1]. Before getting into their implementations, we'll review each one conceptually.

### Kernel Fusion
Since i/o operations to secondary memory are more computationally expensive, kernel fusion aims to reduce them by maximizing the potential of our primary memory. Before going any further, we should clarify what a kernel is. We can think of it as a function that is carried out by number of threads in parallel on a GPU. Somewhat analogous to combining multiple subprocesses on a CPU, this technique combines multiple operations into a single environment or context, instead of executing them sequentially and reading/writing temporary values to secondary memory after each one, since they do not share primary memory. Additionally, just as spawning subprocess involves overhead components, so too does a kernel, meaning fusion reduces these costs as well.

### Gradient Checkpointing
Since bottlenecks are often caused by memory operations and leave computational units idle, we can use the gradient checkpointing strategy to reduce the amount of memory we use in return for increasing the amount of computations being done. In other words, instead of recording all of the data you need, record only a subset (checkpoints) and use it to redo the rest of the calculations as needed. It's like the reverse of memoization, in which a program avoids recomputing values by saving them for reuse. 

## Demos

### User-Driven Kernel Fusion
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

#### Compiler-Driven Kernel Fusion
While a developer can manually combine operations, this strategy is largely applied at a compiler level. Instead of applying optimizations directly to source code, IRs (intermediate representations) enable the transformation of high-level languages into a lower, hardware-agnostic form, while still retaining important semantic information from the original form. MLIR (Multi-Level Intermediate Representation) is a specific form or framework which makes use of fusion and is widely used for machine learning. Like the name suggests, MLIR allows code to be represented at varying levels of abstraction, each conducive to different optimizations[^2].

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

![Before Fusion]({{'/images/other/blogs/computing-resources/before.png' | relative_url}} "Before Fusion")

From here, we can see the relationships between each term and apply a function to recursively traverse the tree. That could transform the original graph into the following:

![After Fusion]({{'/images/other/blogs/computing-resources/after.png' | relative_url}} "After Fusion")

 Implementing this practice in a compiler removes the need to manually apply it to all operations and allows for further optimizations at a smaller level.

The complete code for this implementation can be found [here](https://github.com/brankominick/fusion-demo). 

### Gradient Checkpointing
Unlike kernel fusion, this method is more limited in its use cases but very applicable to the backwards passes in machine learning and AI training. Because it's more specific to AI training, it can be found implemented at the framework level like in PyTorch[^3].

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
In this post, we deepened our understanding of kernel fusion and gradient checkpointing by implementing and visualizing them with simple demos. While each of these strategies brings its own optimizations, they also come with their own limitations, requiring careful consideration in how they're implemented. Additionally, it's important to remember that savings will compound when these techniques and others are applied in conjunction, resulting in higher utilization of compute units and thus, less wasted energy.

## Reflection and Future Direction
As noted in the conclusion, the strategies covered in this post have their limitations. Future work could include examining these bounds such as the payoff for fusion with complex kernels or how preferring primary memory may limit high-precision values. We could also explore other software-level optimization methods. Additionally, we could go in a more concrete direction and extend current frameworks like MLIR to execute and benchmark its current capabilities. Follow along to see what comes next!

# References and Links

[^1]: Makin, Yashasvi, and Rahul Maliakkal. “Sustainable AI Training via Hardware–Software Co-Design on NVIDIA, AMD, and Emerging GPU Architectures.” *arXiv*, preprint arXiv:2508.13163, 28 July 2025, https://arxiv.org/abs/2508.13163.
[^2]: Chris Lattner, Mehdi Amini, Uday Bondhugula, Albert Cohen, Andy Davis, Jacques Pienaar, River Riddle, Tatiana Shpeisman, Nicolas Vasilache, and Oleksandr Zinenko. “MLIR: Scaling compiler infrastructure for domain specific computation.” In 2021 IEEE/ACM International Symposium on Code Generation and Optimization (CGO), pp. 2-14. IEEE, 2021.
[^3]: Paszke, Adam, et al. Automatic Differentiation in PyTorch. 2017, OpenReview, https://openreview.net/pdf?id=BJJsrmfCZ